import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Checkbox,
  TimePicker,
  message,
  Table,
  Modal,
  Badge,
  notification
} from "antd";
import { ClockCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import moment from 'moment-timezone';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const MulticastGroup = () => {
  // State declarations
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [scheduleTime, setScheduleTime] = useState(null);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [isLoadingStart, setIsLoadingStart] = useState(false);
  const [isLoadingReboot, setIsLoadingReboot] = useState(false);
  const [isLoadingStop, setIsLoadingStop] = useState(false);
  const [isLoadingHome, setIsLoadingHome] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [weatherWarnings, setWeatherWarnings] = useState([]);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  // Initial data fetching
  useEffect(() => {
    fetchGroups();
    fetchScheduledTasks();
  }, []);

  useEffect(() => {
  fetchWeatherWarnings();
  const interval = setInterval(fetchWeatherWarnings, 30000);
  return () => clearInterval(interval);
}, []);


  // API functions
  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/multicast-groups`);
      setGroups(response.data.result || []);
    } catch (error) {
      message.error("Error fetching multicast groups.");
    }
  };

  const fetchScheduledTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scheduled-tasks`);
      setScheduledTasks(response.data.tasks || []);
    } catch (error) {
      message.error("Error fetching scheduled tasks.");
    }
  };

  
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
      shouldDisable = false; // ✅ Allow buttons if data is missing
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
  setButtonsDisabled(warnings.length > 0);
  if (shouldDisable) {
    message.warning("Robot operations disabled due to weather conditions.");
  } else {
    message.success("Weather conditions are normal for robot operations.");
  } 
}


  // Handler functions
  const handleSelectAll = (checked) => {
    setSelectedGroups(checked ? groups.map(group => group.id) : []);
  };

  const handleCheckboxChange = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const sendDataToGroups = async (groupIds, action) => {
    let loadingState;
    switch (action) {
      case "start":
        loadingState = setIsLoadingStart;
        break;
      case "stop":
        loadingState = setIsLoadingStop;
        break;
      case "home":
        loadingState = setIsLoadingHome;
        break;
      case "reboot":
        loadingState = setIsLoadingReboot;
        break;
      default:
        message.error(`Unknown action: ${action}`);
        return;
    }

    loadingState(true);

    try {
      const actionData = {
        start: "qAABAgA=",
        stop:"qAABAwA=",
        home: "qAABBAA=",
        reboot:"qAABBQA=",
      };

      const data = actionData[action];
      if (!data) throw new Error(`Unknown action: ${action}`);

      const response = await axios.post(`${API_BASE_URL}/triggerAll`, {
        groupId: groupIds,
        data: data
      });

      if (response.data.success) {
        const successCount = response.data.successfulDevices?.length || 0;
        const missingCount = Object.keys(response.data.missingDevices || {}).length;
          
        notification.success({
          message: 'Action Completed',
          description: (
            <div>
              <p>{`Successfully sent ${action} command to ${successCount} devices`}</p>
              {missingCount > 0 && (
                <p style={{ marginTop: '8px', color: '#ff4d4f' }}>
                  Missing devices: {Object.keys(response.data.missingDevices).join(', ')}
                </p>
              )}
            </div>
          ),
          duration: 5
        });
      }
      
      if (response.data.error) {
        notification.error({
          message: 'Error',
          description: response.data.error,
          duration: 4
        });
      }
    } catch (error) {
      message.error(`Failed to send ${action} to selected groups.`);
    } finally {
      loadingState(false);
    }
  };

  // Modified schedule handler that uses milliseconds timestamp
  const handleScheduleSubmit = async () => {
    try {
      setIsLoadingSchedule(true);

      // Validate inputs
      if (!selectedGroups || selectedGroups.length === 0) {
        throw new Error('Please select at least one group');
      }

      if (!scheduleTime) {
        throw new Error('Please select a schedule time');
      }

      notification.info({
        message: 'Scheduling Task',
        description: 'Sending schedule request...',
        key: 'scheduling-notification',
        duration: 2
      });

      // Generate timestamp in milliseconds for the selected time
      const timestampMs = scheduleTime.valueOf();
      
      console.log("Selected time:", scheduleTime.format('YYYY-MM-DD HH:mm:ss'));
      console.log("Sending timestamp (ms):", timestampMs);

      // Send timestamp instead of formatted date string
      const response = await axios.post(`${API_BASE_URL}/schedule-task`, {
        groupId: selectedGroups,
        scheduleTimeMs: timestampMs // New property name to make it clear we're sending milliseconds
      });

      await fetchScheduledTasks();

      notification.success({
        message: 'Task Scheduled',
        description: `Task scheduled for ${scheduleTime.format('YYYY-MM-DD HH:mm:ss')}`,
        duration: 4,
        key: 'schedule-success'
      });

      // Reset selected time
      setScheduleTime(null);

    } catch (error) {
      if (error.message) {
        notification.error({
          message: 'Validation Error',
          description: error.message,
          duration: 4,
          key: 'validation-error'
        });
      }
      else if (error.response?.data?.error) {
        notification.error({
          message: 'Cannot Schedule Downlink',
          description: error.response.data.error,
          duration: 4,
          key: 'schedule-error'
        });
      }
      else {
        notification.error({
          message: 'Failed to Schedule',
          description: "An unexpected error occurred. Please try again.",
          duration: 4,
          key: 'unknown-error'
        });
      }
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const cancelScheduledTask = async (taskId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/cancel-task/${taskId}`);

      if (response.status === 200) {
        message.success("Scheduled task cancelled successfully");
      } else {
        message.warning("Could not cancel task - unexpected response");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to cancel scheduled task";
      message.error(errorMessage);
      console.error('Cancel task error:', error);
    } finally {
      await fetchScheduledTasks();
    }
  };

  // Table columns configuration
  const scheduledTaskColumns = [
    {
      title: 'Schedule Time',
      dataIndex: 'scheduledTime',
      render: time => moment(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status, record) => (
        <div>
          <Badge
            status={
              status === 'scheduled' ? 'processing' :
                status === 'completed' ? 'success' :
                  status === 'failed' ? 'error' :
                    'default'
            }
            text={status || 'scheduled'}
          />
          {record.error && (
            <div className="mt-2 text-red-500 text-sm">
              {record.error}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => cancelScheduledTask(record.taskId || record.id)}
        >
          Cancel
        </Button>
      )
    }
  ];
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <Card className="shadow-xl rounded-2xl border border-slate-200">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Block-wise / Plant Scheduling of Robots
            </h2>
            <Button
              onClick={() => setIsScheduleModalVisible(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              <ClockCircleOutlined className="h-4 w-4" />
              View Scheduled Tasks
            </Button>
          </div>

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


          {/* Select All Checkbox */}
          <div className="flex items-center">
            <Checkbox
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={selectedGroups.length === groups.length && groups.length > 0}
              indeterminate={selectedGroups.length > 0 && selectedGroups.length < groups.length}
              className="text-slate-700 font-medium"
            >
              Select All Groups
            </Checkbox>
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card
                key={group.id}
                className={`
                relative overflow-hidden transition-all duration-300 rounded-xl
                ${selectedGroups.includes(group.id)
                    ? 'border-2 border-blue-500 bg-blue-50 shadow-blue-100'
                    : 'border border-slate-200 hover:border-blue-300 hover:shadow-lg'}
              `}
              >
                <div className="p-2 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-800">{group.name}</h3>
                    <p className="text-slate-500 text-sm">{group.region}</p>
                  </div>
                  <Checkbox
                    checked={selectedGroups.includes(group.id)}
                    onChange={() => handleCheckboxChange(group.id)}
                    className="text-blue-500"
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-4">
            <Button
              onClick={() => sendDataToGroups(selectedGroups, "start")}
              disabled={buttonsDisabled||selectedGroups.length === 0 || isLoadingStop || isLoadingHome || isLoadingReboot}
              className="w-full md:w-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoadingStart ? "Starting..." : "Start Now"}
            </Button>

            <Button
              onClick={() => sendDataToGroups(selectedGroups, "stop")}
              disabled={buttonsDisabled||selectedGroups.length === 0 || isLoadingStart || isLoadingHome || isLoadingReboot}
              className="w-full md:w-auto px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoadingStop ? "Stopping..." : "Stop Now"}
            </Button>

            <Button
              onClick={() => sendDataToGroups(selectedGroups, "home")}
              disabled={buttonsDisabled||selectedGroups.length === 0 || isLoadingStart || isLoadingStop || isLoadingReboot}
              className="w-full md:w-auto px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoadingHome ? "Returning..." : "Return to Dock"}
            </Button>
            
            <Button
              onClick={() => sendDataToGroups(selectedGroups, "reboot")}
              disabled={buttonsDisabled||selectedGroups.length === 0 || isLoadingStart || isLoadingStop || isLoadingHome}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoadingReboot ? "Rebooting..." : "Reboot"}
            </Button>

            <div className="flex items-center gap-4">
              <TimePicker
                showTime={{ format: 'HH:mm:ss' }}
                format="YYYY-MM-DD HH:mm:ss"
                value={scheduleTime}
                onChange={(time) => setScheduleTime(time)}
                className="w-48 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={handleScheduleSubmit}
                disabled={selectedGroups.length === 0 || !scheduleTime}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoadingSchedule ? "Scheduling..." : "Schedule Now"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title={
          <h3 className="text-xl font-bold text-slate-800">
            Scheduled Tasks
          </h3>
        }
        open={isScheduleModalVisible}
        onCancel={() => setIsScheduleModalVisible(false)}
        footer={null}
        width={800}
        className="rounded-xl overflow-hidden"
      >
        <Table
          dataSource={scheduledTasks}
          columns={scheduledTaskColumns}
          rowKey={record => record.taskId || record.id}
          pagination={false}
          className="border border-slate-200 rounded-lg overflow-hidden"
        />
      </Modal>
    </div>
  );
};

export default MulticastGroup;