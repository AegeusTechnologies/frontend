import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Typography, Space, Button, Tooltip, Spin, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const RobotStatus = () => {
  const [groups, setGroups] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Store active fetch requests to prevent race conditions
  const activeRequests = useRef({});
  // Store the polling interval ID for cleanup
  const pollIntervalRef = useRef(null);

  // Fetch group data - optimized to only run when needed
  const fetchGroupData = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/groupDevices`);
      if (response.data.success) {
        setGroups(response.data.data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      setIsLoading(false);
    }
  }, []);

  // Optimized device data fetching function
  const fetchDeviceData = useCallback(async () => {
    // Get all unique device EUIs from all groups
    const deviceEUIs = new Set();
    groups.forEach(group => {
      group.devices.slice(0, 50).forEach(device => {
        deviceEUIs.add(device.devEui);
      });
    });

    // Fetch data for each device in a batch if possible
    const promises = Array.from(deviceEUIs).map(async (deviceEUI) => {
      // Skip if there's already an active request for this device
      if (activeRequests.current[deviceEUI]) return;
      
      // Mark this request as active
      activeRequests.current[deviceEUI] = true;
      
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/devices/${deviceEUI}/data`);
        
        // Check if device is active - assuming CH2 property indicates activity
        const isActive = response.data?.object?.CH2 === 1;
        
        // Update the device status
        setDeviceStatus(prev => ({
          ...prev,
          [deviceEUI]: isActive
        }));
      } catch (error) {
        // Only log errors if they're not canceled requests
        if (!axios.isCancel(error)) {
          console.error(`Error fetching data for ${deviceEUI}:`, error);
          
          // Mark as inactive if there's an error
          setDeviceStatus(prev => ({
            ...prev,
            [deviceEUI]: false
          }));
        }
      } finally {
        // Clear the active request marker
        delete activeRequests.current[deviceEUI];
      }
    });

    // Wait for all requests to complete
    await Promise.allSettled(promises);
  }, [groups]);

  // Handle group refresh with optimized error handling
  const handleRefresh = useCallback(async (id) => {
    if (isRefreshing[id]) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(prev => ({ ...prev, [id]: true }));
    
    try {


      console.log("Refreshing group..........................................:", [id]);
         const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/triggerAll`, {
         
              groupId:[id],  // Send the array of groupIds directly
              data: "AQ=="         // Send the action data
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

  // Fetch initial data once component mounts
  useEffect(() => {
    fetchGroupData();
    
    // Cleanup function
    return () => {
      // Cancel any pending requests on unmount
      Object.keys(activeRequests.current).forEach(key => {
        delete activeRequests.current[key];
      });
    };
  }, [fetchGroupData]);

  // Setup polling for device status updates
  useEffect(() => {
    if (groups.length === 0 || isLoading) return;
    
    // Initial fetch
    fetchDeviceData();
    
    // Setup interval for polling - 5 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchDeviceData();
    }, 5000);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [groups, isLoading, fetchDeviceData]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '16px', 
      padding: '16px',
      width: '100%',
      margin: '0 auto'
    }}>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : (
        groups.map((group) => (
          <Card
            key={group.groupInfo.id}
            title={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {group.groupInfo.name}
                </Typography.Title>
                <Space>
                  <Tooltip title="Refresh Group">
                    <Button 
                      type="primary" 
                      icon={isRefreshing[group.groupInfo.id] ? <Spin size="small" /> : <ReloadOutlined />}
                      onClick={() => handleRefresh(group.groupInfo.id)}
                      disabled={isRefreshing[group.groupInfo.id]}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            }
            style={{ 
              width: '100%', 
              marginBottom: '16px' 
            }}
          >
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              {group.deviceCount} {group.deviceCount === 1 ? 'Robot' : 'Robots'}
            </Typography.Text>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '8px' 
            }}>
              {group.devices.slice(0, 50).map((device) => (
                <Tooltip 
                  key={device.devEui} 
                  title={`${device.name} - ${deviceStatus[device.devEui] ? 'Active' : 'Inactive'}`}
                >
                  <Space 
                    direction="vertical" 
                    align="center" 
                    style={{
                      padding: '8px',
                      background: 'rgba(0,0,0,0.02)',
                      borderRadius: '6px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div 
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: deviceStatus[device.devEui] ? '#52c41a' : '#d9d9d9',
                        boxShadow: deviceStatus[device.devEui] 
                          ? '0 0 10px rgba(82, 196, 26, 0.5)' 
                          : 'none',
                        transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
                      }}
                    />
                    <Typography.Text 
                      style={{ 
                        fontSize: '12px',
                        fontWeight: '500',
                        color: deviceStatus[device.devEui] ? '#52c41a' : '#999',
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {device.name}
                    </Typography.Text>
                  </Space>
                </Tooltip>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default RobotStatus;