import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Table, Modal, Space, Badge, message, List, Typography, Tag, Card, Avatar } from 'antd';
import { 
  ClockCircleOutlined, 
  SearchOutlined, 
  PoweroffOutlined, 
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WifiOutlined, RobotOutlined
} from "@ant-design/icons";
import { useLocalStorageforall } from '../../useLocalStorage';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL
const ITEMS_PER_PAGE = 10;

function Devices({ humidityThreshold, rainThreshold, windSpeedThreshold }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageEvent,setMessageEvent]= useState([]);
  const [weatherWarnings, setWeatherWarnings] = useState([]);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [disabledDevices, setDisabledDevices] = useLocalStorageforall('disabledDevices', [])
  const [isDisabledModalVisible, setIsDisabledModalVisible] = useState(false);
  const [messageModelVisible, setMessageModalVisible] = useState(false);
  const [count,setCount]=useState(0);
  const navigate = useNavigate();


  const getStatusColor = (status) => {
    const statusMap = {
      'success': 'success',
      'error': 'error',
      'pending': 'warning',
      'processing': 'processing',
      'default': 'default'
    };
    
    return statusMap[status.toLowerCase()] || 'default';
  };


  const clearAllMessages = async () => {
    try {
      await fetch(`${API_BASE_URL}/events/clear`);
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(clearAllMessages, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  // Load disabled devices from localStorage on component mount
  useEffect(() => {
    const savedDisabledDevices = localStorage.getItem('disabledDevices');
    if (savedDisabledDevices) {
      setDisabledDevices(JSON.parse(savedDisabledDevices));
    }
  }, []);

 
  

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/count`);
        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch count:', error);
      }
    };
  
    fetchCount();
    
    const interval = setInterval(fetchCount, 30000); 
    return () => clearInterval(interval);
  }, []); 

  // Save disabled devices to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('disabledDevices', JSON.stringify(disabledDevices));
  }, [disabledDevices]);

     async function fetchData() {
      try {
        // Fetch weather data
        const weatherResponse = await fetch(`${API_BASE_URL}/gateway`);
        if (weatherResponse.ok) {
          const data = await weatherResponse.json();
          const weatherData = data.weather;

          const warnings = [];
          if (parseFloat(weatherData.humidity) > parseFloat(humidityThreshold)) {
            warnings.push(`Humidity (${weatherData.humidity}%) exceeds threshold (${humidityThreshold}%)`);
          }
          if (parseFloat(weatherData.rain) > parseFloat(rainThreshold)) {
            warnings.push(`Rain detected (${weatherData.rain}mm)`);
          }
          // Convert wind speed from m/s to mph (1 m/s = 2.23694 mph)
          const windSpeedMph = weatherData.windSpeed * 2.23694;
          console.log('Raw wind speed (m/s):', weatherData.windSpeed);
          console.log('Converted wind speed (mph):', windSpeedMph.toFixed(2));
          if (windSpeedMph > Number(windSpeedThreshold)) {
            warnings.push(`Wind speed (${windSpeedMph.toFixed(2)}mph) exceeds threshold (${windSpeedThreshold}mph)`);
          }

          setWeatherWarnings(warnings);
          setButtonsDisabled(warnings.length > 0);
        }

        // Fetch devices data
        const response = await fetch(`${API_BASE_URL}/devices`);
        if (!response.ok) throw new Error("Failed to fetch devices");
        const devicesData = await response.json();
        setDevices(devicesData.result);
      } catch (error) {

        setWeatherWarnings(['Failed to fetch weather data']);
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [humidityThreshold, rainThreshold, windSpeedThreshold]);


  useEffect(() => {
    const fetchMessageEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if (response.ok) {
          const data = await response.json();
          setMessageEvent(data); 
        }
      } catch (error) {
        console.error('Failed to fetch message events:', error);
      }
    };
  
    fetchMessageEvents();
  
    const interval = setInterval(fetchMessageEvents, 30000);
    return () => clearInterval(interval);
  }, []);
 

  const handleToggleDevice = async (devEui, state) => {
    if (buttonsDisabled) {
      const warningMessage = weatherWarnings.join('\n');
      alert(`Cannot operate robot due to weather conditions:\n${warningMessage}`);
      return;
    }
    
    try {
      await toggleDeviceDownlink(devEui, state);
      message.success(`Command ${state} sent successfully`);
    } catch (error) {
      message.error(`Failed to send command: ${error.message}`);
    }
  };

  const handleToggleEnabled = async (device) => {
    const isCurrentlyDisabled = disabledDevices.includes(device.devEui);
    try {
      // Send downlink command (07 to enable, 06 to disable)
      const command = isCurrentlyDisabled ? "07" : "06";
      await toggleDeviceDownlink(device.devEui, command);
      
      // Update local state
      if (isCurrentlyDisabled) {
        setDisabledDevices(disabledDevices.filter(d => d !== device.devEui));
      } else {
        setDisabledDevices([...disabledDevices, device.devEui]);
      }
      
      alert(`Robot successfully ${isCurrentlyDisabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      alert(`Failed to ${isCurrentlyDisabled ? 'enable' : 'disable'} robot: ${error.message}`);
    }
  };

  const columns = [
    {
      title: 'Robot Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Badge status={disabledDevices.includes(record.devEui) ? 'error' : 'success'} />
          {text}
        </Space>
      ),
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isDisabled = disabledDevices.includes(record.devEui);
        return (
          <Space size="middle">
            <Button
              type={isDisabled ? 'default' : 'primary'}
              onClick={() => handleToggleEnabled(record)}
              icon={<PoweroffOutlined />}
              danger={!isDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${isDisabled 
                  ? 'bg-gray-100 hover:bg-gray-200 border-gray-300' 
                  : 'bg-red-500 hover:bg-red-600 border-none text-white'}
              `}
              style={{ minWidth: '100px', borderRadius: '8px' }}
            >
              {isDisabled ? 'Enable' : 'Disable'}
            </Button>
            <Button
              onClick={() => handleToggleDevice(record.devEui, "on")}
              disabled={isDisabled || buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${isDisabled || buttonsDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-emerald-500 hover:bg-emerald-600 border-none text-white'}
              `}
              style={{ minWidth: '90px', borderRadius: '8px' }}
            >
              Turn On
            </Button>
            <Button
              onClick={() => handleToggleDevice(record.devEui, "off")}
              disabled={isDisabled || buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${isDisabled || buttonsDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-rose-500 hover:bg-rose-600 border-none text-white'}
              `}
              style={{ minWidth: '90px', borderRadius: '8px' }}
            >
              Turn Off
            </Button>
            <Button
              onClick={() => handleToggleDevice(record.devEui, "gohome")}
              disabled={isDisabled || buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${isDisabled || buttonsDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-indigo-500 hover:bg-indigo-600 border-none text-white'}
              `}
              style={{ minWidth: '120px', borderRadius: '8px' }}
            >
              Return To Dock
            </Button>
            <Button
              onClick={() => handleToggleDevice(record.devEui, "reboot")}
              disabled={isDisabled || buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${isDisabled || buttonsDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-amber-500 hover:bg-amber-600 border-none text-white'}
              `}
              style={{ minWidth: '90px', borderRadius: '8px' }}
            >
              Reboot
            </Button>
            <Button
              onClick={() => navigate(`/device/${record.devEui}`)}
              className="hover:scale-105 transform transition-all duration-300
                bg-cyan-500 hover:bg-cyan-600 border-none text-white"
              style={{ minWidth: '90px', borderRadius: '8px' }}
            >
              View
            </Button>
          </Space>
        );
      },
    },
  ];

  const disabledColumns = [
    {
      title: 'Robot Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => handleToggleEnabled(record)}
        >
          Enable
        </Button>
      ),
    },
  ];

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Robots</h1>
        <Space>
          <Button
            type="primary"
            icon={<ClockCircleOutlined />}
            onClick={() => setIsDisabledModalVisible(true)}
          >
            View Disabled Robots
          </Button>

          <Button
  type="primary"
  icon={<MessageOutlined />}
  onClick={() => setMessageModalVisible(true)}
  className="hover:scale-105 transform transition-all duration-300"
>
  Messages ({count})
</Button>
        </Space>
      </div>

      <Input
        placeholder="Search robots..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      {weatherWarnings.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Robot operations disabled due to weather conditions:
              </p>
              <ul className="mt-2 list-disc list-inside text-sm text-red-700">
                {weatherWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Table
        dataSource={filteredDevices}
        columns={columns}
        rowKey="devEui"
        loading={loading}
        pagination={{
          pageSize: ITEMS_PER_PAGE,
          showSizeChanger: false,
        }}
      />

      <Modal
        title="Disabled Robots"
        open={isDisabledModalVisible}
        onCancel={() => setIsDisabledModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={devices.filter(device => disabledDevices.includes(device.devEui))}
          columns={disabledColumns}
          rowKey="devEui"
          pagination={false}
        />
      </Modal>


      <Modal
      title={
        <Space>
          <RobotOutlined style={{ fontSize: '18px' }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Robot Messages
          </Typography.Title>

        </Space>
      }
      open={messageModelVisible}
      onCancel={() => setMessageModalVisible(false)}
      footer={null}
      width={800}
      className="robot-messages-modal"
    >
      <List
        dataSource={messageEvent}
        renderItem={(item) => (
          <List.Item>
            <Card 
              style={{ width: '100%' }} 
              hoverable
              className="message-card"
              bodyStyle={{ padding: '16px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="center">
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                  <Typography.Text strong>{item.robotName}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Typography.Text>
                </Space>
                
                <Space wrap style={{ marginTop: '8px' }}>
                  {item.acknowledged !== undefined && (
                    <Tag color={item.acknowledged ? 'success' : 'error'} icon={item.acknowledged ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                      {item.acknowledged ? 'Acknowledged' : 'Not Acknowledged'}
                    </Tag>
                  )}
                  
                  {item.Gatewayreceived && (
                    <Tag color="processing" icon={<WifiOutlined />}>
                      Gateway Received: {item.Gatewayreceived}
                    </Tag>
                  )}
                  
                  {item.status && (
                    <Tag color={getStatusColor(item.status)} icon={<ClockCircleOutlined />}>
                      Status: {item.status}
                    </Tag>
                  )}
                </Space>
                
                {item.message && (
                  <Typography.Paragraph className="message-content" style={{ marginTop: '8px' }}>
                    {item.message}
                  </Typography.Paragraph>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
          showTotal: (total) => `Total ${total} messages`,
          showQuickJumper: true,
          position: 'bottom',
          style: { marginTop: '16px', textAlign: 'right' }
        }}
      />
    </Modal>
    </div>
  );
}

async function toggleDeviceDownlink(devEui, state) {
  // Convert state to base64
  const dataMap = {
    on: "Ag==",
    off: "Aw==", //off command
    gohome: "BA==",// go home command
    reboot: "BQ==", // Reboot command
    "06": "Bg==", // Disable command
    "07": "Bw==", // Enable command
    
  };

  const response = await fetch(`${API_BASE_URL}/devices/${devEui}/queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      queueItem: {
        data: dataMap[state],//"Ag=="
        fCnt: 0,
        fPort: 1,
        confirmed: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send command");
  }

  const responseData = await response.json();
  message.success(`Command sent successfully. ID: ${responseData.id}`);
}

export default Devices;