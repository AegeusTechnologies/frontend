import { useState, useEffect, useCallback } from "react";
import { Card, Button, Tooltip, Typography, Box, CircularProgress } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import axios from "axios";
import { message } from "antd";




const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const RobotStatusDashboard = () => {
  const [groupsData, setGroupsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState({});
  //const [refreshInterval, setRefreshInterval] = useState(null);

  // Fetch groups and devices data
  useEffect(() => {
  fetchAllData();
  const interval = setInterval(fetchAllData, 30000); 
  return () => clearInterval(interval); 
   
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Groupdevices`);
      const result = await response.json();
      if (result.success) {
        setGroupsData(result.data);
        // Fetch status for each device
        const allDevices = result.data.flatMap(group => 
          group.devices.map(device => device.devEui)
        );
        fetchDeviceStatuses(allDevices);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
      message.error("Failed to load groups data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch status for all devices
  const fetchDeviceStatuses = async (deviceEuis) => {
    const statusMap = {};
    await Promise.all(
      deviceEuis.map(async (devEui) => {
        try {
          const response = await fetch(`${API_BASE_URL}/status/${devEui}`);
          const result = await response.json();
          console.log(`Status for device ${devEui}:`, result);
          statusMap[devEui] = result.status === "RUNNING";
        } catch (error) {
          console.error(`Error fetching status for device ${devEui}:`, error);
          statusMap[devEui] = false; // Default to not running if error
        }
      })
    );

    setDeviceStatus(statusMap);
  };

  // Handle group refresh with optimized error handling
  const handleRefresh = useCallback(async (id) => {
    if (isRefreshing[id]) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/triggerAll`, {
        groupId: [id],  
        data: "a800010100"   
      });
      
      if (response.data) {
        message.success(`Successfully sent command to group ${id}`);
      } else {
        message.error("Failed to schedule the group, ChirpStack didn't receive the command");
      }
    } catch (error) {
      console.error('Error refreshing group:', error);
      message.error("Something went wrong. ChirpStack server may be down");
    } finally {
      setIsRefreshing(prev => ({ ...prev, [id]: false }));
    }
  }, [isRefreshing]);

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4">Robot Status Dashboard</Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={fetchAllData}
        >
          Refresh All
        </Button>
      </Box>
      
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupsData.map((group) => (
          <Card key={group.groupInfo.id} className="p-6">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold">
                {group.groupInfo.name}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => handleRefresh(group.groupInfo.id)}
                disabled={isRefreshing[group.groupInfo.id]}
              >
                {isRefreshing[group.groupInfo.id] ? (
                  <CircularProgress size={20} />
                ) : (
                  "Refresh"
                )}
              </Button>
            </Box>
            
            <Typography variant="body2" className="text-gray-600 mb-4">
              {group.deviceCount} devices 
            </Typography>
            
            <Box className="flex flex-wrap gap-3 mt-4">
              {group.devices.map((device) => (
                <Tooltip 
                  key={device.devEui}
                  title={
                    <div>
                      <div><strong>Name:</strong> {device.name}</div>
                      {/* <div><strong>Description:</strong> {device.description || "N/A"}</div> */}
                      <div><strong>Status:</strong> {deviceStatus[device.devEui] ? "RUNNING" : "NOT RUNNING"}</div>
                      <div><strong>Last Seen:</strong> {new Date(device.lastSeenAt).toLocaleString()}</div>
                    </div>
                  }
                >
                  <Box
                    className="rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
                    sx={{
                      width: 50,
                      height: 50,
                      backgroundColor: deviceStatus[device.devEui] ? "rgb(34, 197, 94)" : "rgb(156, 163, 175)",
                      borderColor: deviceStatus[device.devEui] ? "rgb(22, 163, 74)" : "rgb(107, 114, 128)"
                    }}
                  >
                  
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default RobotStatusDashboard;