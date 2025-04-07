import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_exporting from 'highcharts/modules/exporting';
import HC_exportData from 'highcharts/modules/export-data';
import HC_offlineExporting from 'highcharts/modules/offline-exporting';


import { 
  
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  Paper,
  
} from '@mui/material';

import { 
  DeviceHub as DeviceHubIcon,
  DevicesOther as DevicesIcon,
  CheckCircle as ActiveIcon,
  ErrorOutline as InactiveIcon
} from '@mui/icons-material';
import { Modal, Table } from 'antd';
const Dashboard = () => {
  // State for devices and modals
  const [inactiveDevices, setInactiveDevices] = useState([]);
  const [activeDevices, setActiveDevices] = useState([]);
  const [showInactiveDevices, setShowInactiveDevices] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [showActiveDevices, setShowActiveDevices] = useState(false);
  const [allDevices, setAllDevices] = useState([]);
  const [batteryChart, setBatteryChart] = useState(null)
  const  [ panelsCleaned,setPanelsCleaned]= useState(null)
  
  const [dashboardData, setDashboardData] = useState({
    multicastGroups: { totalCount: 0 },
    devices: { 
      totalCount: 0, 
      activeCount: 0, 
      inactiveCount: 0 
    },
    performanceData: [],
    energyStats: {
      totalEnergyGenerated: 0,
      totalPanelsCleaned: 0
    }
  });
  // Color Palette
  const colors = {
    primary: '#3f51b5',
    secondary: '#f50057',
    success: '#4caf50',
    info: '#2196f3',
    warning: '#ff9800',
    background: '#f4f6f8'
  };
  // Limit data points for better visualization
  const limitDataPoints = (data, maxPoints = 7) => {
    if (data.length <= maxPoints) return data;
    
    // Take last 7 data points
    return data.slice(-maxPoints);
  };
  // Styled Card Component
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = colors.primary ,
    onClick
  }) => (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        borderRadius: 2,
        background: `linear-gradient(145deg, ${color}33, ${color}11)`
      }}
    onClick={onClick}  // Add this handler
    style={{ cursor: 'pointer' }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mr: 2 
      }}>
        <Icon 
          sx={{ 
            fontSize: 40, 
            color: color,
            opacity: 0.7 
          }} 
        />
      </Box>
      <Box>
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          sx={{ lineHeight: 1 }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h5" 
          fontWeight="bold" 
          color="text.primary"
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
// Column definitions for the device tables
  const deviceColumns = [
    {
      title: 'Device Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      render: (text) => new Date(text).toLocaleString(),
    },
   ];

   useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/robot-battery-report/weekly`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add exporting options to the chart configuration
            const chartConfig = {
                ...data.chartData,
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: [
                                'downloadPNG',
                                'downloadJPEG',
                                'downloadPDF',
                                'downloadSVG',
                                'downloadCSV',
                                'downloadXLS'
                            ]
                        }
                    }
                }
            };
            setBatteryChart(chartConfig);
        }
    })
    .catch(error => console.error('Error:', error));
}, []);

useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/robot-panels-report/weekly`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add exporting options to the chart configuration
            const chartConfig = {
                ...data.chartData,
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: [
                                'downloadPNG',
                                'downloadJPEG',
                                'downloadPDF',
                                'downloadSVG',
                                'downloadCSV',
                                'downloadXLS'
                            ]
                        }
                    }
                }
            };
            setPanelsCleaned(chartConfig);
        }
    })
    .catch(error => console.error('Error:', error));
}, []);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {

        const multicastResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/multicast-groups`)
        const devicesResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/devices`)
        const devices = devicesResponse.data.result;
        // Filter active and inactive devices
        const now = new Date();
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        const activeDevicesList = devices.filter(device => {
          const lastSeen = new Date(device.lastSeenAt);
          return (now - lastSeen) <= thirtyMinutes;
        });
        const inactiveDevicesList = devices.filter(device => {
          const lastSeen = new Date(device.lastSeenAt);
          return (now - lastSeen) > thirtyMinutes;
        });

        // Update state
        setAllDevices(devices);
        setActiveDevices(activeDevicesList);
        setInactiveDevices(inactiveDevicesList);

        setDashboardData({
          multicastGroups: {
            totalCount: multicastResponse.data.totalCount
          },
          devices: {
            totalCount: devices.length,
            activeCount: activeDevicesList.length,
            inactiveCount: inactiveDevicesList.length
          },
          
        });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      }
    };

    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const renderCustomLabel = ({ name, percent }) => {
    return `${(percent * 100).toFixed(0)}%`;
  };
 
  const DeviceStatusPieChart = ({ data, colors }) => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} devices`, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Modal content for device status
  const DeviceStatusModal = ({ title, devices, showModal, handleClose }) => {
    const pieData = [
      { name: 'Selected Devices', value: devices.length },
      { name: 'Other Devices', value: dashboardData.devices.totalCount - devices.length }
    ];

   
    return (
      <Modal
        title={title}
        open={showModal}
        onCancel={handleClose}
        footer={null}
        width={800}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Device Distribution
            </Typography>
            <DeviceStatusPieChart 
              data={pieData}
              colors={[colors.success, colors.secondary]}
            />
            <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
              Total Devices: {dashboardData.devices.totalCount}
              <br />
              {title}: {devices.length}
            </Typography>
          </CardContent>
        </Card>
      </Modal>
    );
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: 3, 
      backgroundColor: colors.background 
    }}>
      {/* Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
  {[ 
    { 
      title: 'Blocks', 
      value: dashboardData.multicastGroups.totalCount,
      icon: DeviceHubIcon,
      color: colors.primary
    },
    { 
      title: 'Total Robots', 
      value: dashboardData.devices.totalCount,
      icon: DevicesIcon,
      color: colors.info,
      onClick: () => setShowAllDevices(true)  // This will work now
    },
    { 
      title: 'Active Robots', 
      value: dashboardData.devices.activeCount,
      icon: ActiveIcon,
      color: colors.success,
      onClick: () => setShowActiveDevices(true)  // This will work now
    },
    { 
      title: 'Inactive Robots', 
      value: dashboardData.devices.inactiveCount,
      icon: InactiveIcon,
      color: colors.secondary,
      onClick: () => setShowInactiveDevices(true)  // This will work now
    }
  ].map((cardData, index) => (
    <Grid item xs={12} sm={6} md={3} key={index}>
      <StatCard {...cardData} />
    </Grid>
  ))}
</Grid>
        <div>
            {panelsCleaned && (
                <HighchartsReact
                    highcharts={Highcharts}
                    options={panelsCleaned}
                />
            )}
        </div>

        <div>
            {batteryChart && (
                <HighchartsReact
                    highcharts={Highcharts}
                    options={batteryChart}
                />
            )}
        </div>
              <Modal
          title="Inactive Devices"
          open={showInactiveDevices}
          onCancel={() => setShowInactiveDevices(false)}
          footer={null}
          width={800}
              >
          <Table
            dataSource={inactiveDevices}
            columns={[
              {
                title: 'Robot Name',
                dataIndex: 'name',
                key: 'name',
                sorter: (a, b) => a.name.localeCompare(b.name)
              },
              {
                title: 'Last Seen',
                dataIndex: 'lastSeenAt',
                key: 'lastSeenAt',
                render: (text) => new Date(text).toLocaleString(),
                sorter: (a, b) => new Date(a.lastSeenAt) - new Date(b.lastSeenAt)
              },
              {
                title: 'Status',
                key: 'status',
                render: () => <span style={{ color: 'red' }}>Inactive</span>
              }
            ]}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 400 }}
          />
              </Modal>

              <Modal
          title="All Robots"
          open={showAllDevices}
          onCancel={() => setShowAllDevices(false)}
          footer={null}
          width={800}
              >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Robots Status Distribution
              </Typography>
              {/* Render the Pie Chart here */}
      <DeviceStatusPieChart
        data={[
          { name: 'Active Robots', value: dashboardData.devices.activeCount },
          { name: 'Inactive Robots', value: dashboardData.devices.inactiveCount }
        ]}
        colors={[colors.success, colors.secondary]}
        />
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          Total Robots: {dashboardData.devices.totalCount}
          <br />
          Active Robots: {dashboardData.devices.activeCount}
          <br />
          Inactive Robots: {dashboardData.devices.inactiveCount}
        </Typography>
          </CardContent>
        </Card>
      </Modal>

      <Modal
        title="Active Devices"
        open={showActiveDevices}
        onCancel={() => setShowActiveDevices(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={activeDevices}
          columns={[
        {
          title: 'Robot Name',
          dataIndex: 'name',
          key: 'name',
          sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
          title: 'Last Seen',
          dataIndex: 'lastSeenAt',
          key: 'lastSeenAt',
          render: (text) => new Date(text).toLocaleString(),
          sorter: (a, b) => new Date(a.lastSeenAt) - new Date(b.lastSeenAt)
        },
        {
          title: 'Status',
          key: 'status',
          render: () => <span style={{ color: 'green' }}>Active</span>
        }
          ]}
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Modal>
          </Box>
        );
      };



export default Dashboard;
