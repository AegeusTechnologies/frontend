import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Typography, Space, Button, Tooltip, Spin, message, Tabs } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;

// Single Group Dashboard Component
const RobotStatusDashboard = ({ groupId }) => {
  const [devices, setDevices] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDevicesAndStatus = async () => {
      try {
        // 1. Get all devices in the group
        const groupRes = await axios.get(`/groups/${groupId}/devices`);
        const deviceList = groupRes.data;
        setDevices(deviceList);
        
        // 2. For each device, fetch its latest data
        const statusMap = {};
        await Promise.all(
          deviceList.map(async (device) => {
            try {
              const statusRes = await axios.get(`/devices/${device.devEui}/data?limit=1`);
              const latest = statusRes.data?.data?.[0];
              statusMap[device.devEui] = latest?.payload?.status || 'unknown';
            } catch (err) {
              console.error(`Error fetching data for device ${device.devEui}`, err);
              statusMap[device.devEui] = 'error';
            }
          })
        );
        setDeviceStatus(statusMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching group devices:', error);
        setLoading(false);
      }
    };
    
    if (groupId) {
      fetchDevicesAndStatus();
    }
  }, [groupId]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Robot Status (Group ID: {groupId})</h2>
      {loading ? (
        <p>Loading device statuses...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.devEui}
              className="border rounded-lg p-4 shadow-md"
            >
              <h3 className="font-bold text-lg">{device.name || device.devEui}</h3>
              <p>Status: {deviceStatus[device.devEui]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main RobotStatus Component
const RobotStatus = () => {
  const [groups, setGroups] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'detailed'
  
  // Store active fetch requests to prevent race conditions
  const activeRequests = useRef({});
  // Store the polling interval ID for cleanup
  const pollIntervalRef = useRef(null);

  // Fetch group data - optimized to only run when needed
  const fetchGroupData = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/groupDevices`);
      if (response.data.success) {
        const groupsData = response.data.data;
        setGroups(groupsData);
        
        // Set the first group as active if we have groups and no active group
        if (groupsData.length > 0 && !activeGroupId) {
          setActiveGroupId(groupsData[0].groupInfo.id);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      setIsLoading(false);
    }
  }, [activeGroupId]);

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
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/triggerAll`, {
        groupId: [id],  // Send the array of groupIds directly
        data: "AQ=="   // Send the action data
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

  // Change view mode
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'overview' ? 'detailed' : 'overview');
  }, []);

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

  // Render the detailed view for a specific group
  const renderDetailedView = () => {
    if (!activeGroupId) return <div>No group selected</div>;
    return <RobotStatusDashboard groupId={activeGroupId} />;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '16px', 
      padding: '16px',
      width: '100%',
      margin: '0 auto'
    }}>
      {/* View Mode Toggle */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px'
      }}>
      
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      ) : viewMode === 'detailed' ? (
        /* Detailed View */
        <Tabs 
          activeKey={activeGroupId?.toString()}
          onChange={(key) => setActiveGroupId(key)}
          type="card"
        >
          {groups.map((group) => (
            <TabPane tab={group.groupInfo.name} key={group.groupInfo.id}>
              <RobotStatusDashboard groupId={group.groupInfo.id} />
            </TabPane>
          ))}
        </Tabs>
      ) : (
        /* Overview (Original) View */
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