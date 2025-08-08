import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Table, Modal, Space, Badge, message, List, Typography, Tag, Card, Avatar } from 'antd';
import { 
  ClockCircleOutlined, 
  SearchOutlined, 
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WifiOutlined, RobotOutlined
} from "@ant-design/icons";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL
const ITEMS_PER_PAGE = 10;

function Devices({ humidityThreshold, rainThreshold, windSpeedThreshold }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [weatherWarnings, setWeatherWarnings] = useState([]);
  const [messageModelVisible, setMessageModalVisible] = useState(false);
  const [messageEvent, setMessageEvent] = useState([]);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  
  async function fetchWeatherWarnings() {
    const warnings = [];
    let shouldDisable = false;
  
    try {
      const thresholdRes = await fetch('http://localhost:5002/api/weather-thresold');
      const thresholdJson = await thresholdRes.json();
      const threshold = thresholdJson?.result?.data;
  
      const weatherRes = await fetch('http://localhost:5002/api/weatherData');
      const weatherJson = await weatherRes.json();
      const current = weatherJson?.data;
  
      if (!threshold || !current) {
        warnings.push("Weather data or threshold is unavailable.");
        shouldDisable = false;
      } else {
        if (current.rain_gauge > threshold.rain_gauge) {
          warnings.push(`Rain gauge (${current.rain_gauge}mm) exceeds threshold (${threshold.rain_gauge}mm)`);
          shouldDisable = true;
        }
  
        if (current.wind_speed > threshold.wind_speed) {
          warnings.push(`Wind speed (${current.wind_speed} m/s) exceeds threshold (${threshold.wind_speed} m/s)`);
          shouldDisable = true;
        }
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      warnings.push("Error fetching weather or threshold data.");
      shouldDisable = false;
    }
  
    setWeatherWarnings(warnings);
    setButtonsDisabled(shouldDisable);
    setCount(warnings.length);
  } // ✅ This closing brace was missing
  



  async function fetchDevicesData() {
    try {
      const response = await fetch(`${API_BASE_URL}/devices`);
      if (!response.ok) throw new Error("Failed to fetch devices");
  
      const devicesData = await response.json();
      setDevices(devicesData.result);
    } catch (error) {
      console.error("Error fetching device data:", error);
      message.error("Failed to fetch device data");
    } finally {
      setLoading(false);
    }
  }
async function fetchData() {
  setLoading(true);
  await Promise.all([
    fetchWeatherWarnings(),
    fetchDevicesData()
  ]);
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

  const columns = [
    {
      title: 'Robot Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Badge status="success" />
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
      title: 'location',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        return (
          <Space size="middle">
            <Button
              onClick={() => handleToggleDevice(record.devEui, "on")}
              disabled={buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${buttonsDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-emerald-500 hover:bg-emerald-600 border-none text-white'}
              `}
              style={{ minWidth: '90px', borderRadius: '8px' }}
            >
              Turn On
            </Button>
            <Button
              onClick={() => handleToggleDevice(record.devEui, "off")}
              disabled={buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${buttonsDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-rose-500 hover:bg-rose-600 border-none text-white'}
              `}
              style={{ minWidth: '90px', borderRadius: '8px' }}
            >
              Turn Off
            </Button>
            <Button
              onClick={() => handleToggleDevice(record.devEui, "gohome")}
              disabled={buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${buttonsDisabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-indigo-500 hover:bg-indigo-600 border-none text-white'}
              `}
              style={{ minWidth: '120px', borderRadius: '8px' }}
            >
              Return To Dock
            </Button>
            <Button
              onClick={() => handleToggleDevice(record.devEui, "reboot")}
              disabled={buttonsDisabled}
              className={`
                hover:scale-105 transform transition-all duration-300
                ${buttonsDisabled
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

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) || device.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Robots</h1>
        <Space>
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
  on: "qAABAgA=",
  off: "qAABAwA=", //off command
  gohome: "qAABBAA=",// go home command
  reboot: "qAABBQA=", // Reboot command
  "06": "qAABBgA=", // Disable command
  "07": "qAABBwA=", // Enable command
  
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
function getStatusColor(status) {
  switch (status) {
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'orange';
    default:
      return 'blue';
  }
}

export default Devices;
