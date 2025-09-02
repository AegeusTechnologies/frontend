import React, { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import axios from 'axios';
import BatteryGauge from 'react-battery-gauge';
import { Box, Button, Card, Typography } from '@mui/material';
import { RefreshCcwDot } from 'lucide-react';

const RobotBatteryVoltage = () => {
  const [devicesData, setDevicesData] = useState({});
  const [loading, setLoading] = useState(true);

  // Voltage thresholds
  const CRITICAL_THRESHOLD = 20.0;
  const LOW_THRESHOLD = 23.0;
  const MAX_VOLTAGE = 30.0;

  console.log("this is only for the testign purpsoe",devicesData);

  useEffect(() => {
    fetchAllData();
  }, []);

  const downloadData = () => {
    const headers = ["Block", "Robot Name", "batteryVolt"];
  
    const csvRows = [
      headers.join(","),
      ...Object.entries(devicesData).flatMap(([groupName, devices]) =>
        devices.map(device =>
          `${device.description}, ${device.name}, ${device.batteryVolt || 'N/A'}`
        )
      )
    ];
  
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `robot_battery_data_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Data downloaded successfully");
  };

  
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchAllData = async () => {
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/Groupdevices`);

      if (response.data.success) {
        const groups = response.data.data;

        const allDevices = groups.flatMap(group =>
          group.devices.map(device => ({
            ...device,
            groupName: group.groupInfo.name
          }))
        );

        const devicesWithBattery = await Promise.all(
          allDevices.map(async (device) => {
            try {
              const batteryResponse = await axios.get(
                `http://localhost:5002/api/robot-battery/${device.devEui}`
              );

              const voltage = batteryResponse.data.success
                ? Number(batteryResponse.data.batteryPercent) // batteryPercent holds voltage
                : null;

              return {
                ...device,
                batteryVolt: voltage
              };
            } catch (error) {
              console.error(`Battery fetch failed for ${device.devEui}`, error);
              return {
                ...device,
                batteryVolt: null
              };
            }
          })
        );

        // Group by block
        const grouped = devicesWithBattery.reduce((acc, device) => {
          if (!acc[device.groupName]) acc[device.groupName] = [];
          acc[device.groupName].push(device);
          return acc;
        }, {});

        setDevicesData(grouped);
      }
    } catch (error) {
      console.error("Error fetching group devices:", error);
      message.error("Failed to load device data");
    } finally {
      setLoading(false);
    }
  };

  const getBatteryStatus = (voltage) => {
    voltage = parseFloat(voltage);

    if (voltage === null || typeof voltage !== 'number' || isNaN(voltage)) {
      return { statusText: 'Offline', color: '#999' };
    }
    if (voltage <= CRITICAL_THRESHOLD) {
      return { statusText: 'Critical', color: '#ff4d4f' };
    }
    if (voltage <= LOW_THRESHOLD) {
      return { statusText: 'Low', color: '#EB2626' };
    }
    return { statusText: 'Normal', color: '#52c41a' };
  };

  return (
    <div className="p-4">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5" className="font-bold">
          Robots Battery Monitoring
        </Typography>
        <Button 
        variant='contained'
        color='primary'
        onClick={downloadData} 
        >
            download
        </Button>
      </Box>

      {loading ? (
        <Box className="flex items-center justify-center h-64">
          <Spin size="large" />
        </Box>
      ) : (
        <Box className="grid grid-cols-1 gap-6">
          {Object.entries(devicesData).map(([groupName, devices]) => (
            <Card key={groupName} className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold">
                  {groupName}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {devices.length} devices
                </Typography>
              </Box>

              <Box className="flex flex-wrap gap-4 mt-4">
                {devices.map((device) => {
                  const { statusText, color } = getBatteryStatus(parseFloat(device.batteryVolt));

                  return (
                    <Card key={device.devEui} className="p-4" style={{ width: '200px' }}>
                      <Typography variant="body1" className="font-bold">
                        {device.name || device.devEui}
                      </Typography>

                      <Typography variant="body2" className="text-gray-500 mb-2">
                        {device.description || 'No description'}
                      </Typography>

                      <BatteryGauge
                        value={parseFloat(device.batteryVolt) ||0}
                        maxValue={MAX_VOLTAGE}
                        size={40}
                        color={color}
                      />

                      <Typography variant="body2" style={{ color }}>
                        {statusText} – {`${parseFloat(device.batteryVolt)} V`}
                      </Typography>
                    </Card>
                  );
                })}
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </div>
  );
};

export default RobotBatteryVoltage;
