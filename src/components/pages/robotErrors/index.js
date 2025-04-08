import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RobotErrors = () => {
  const [robotData,setRobotData]= useState([]);

  const faultCodes = {
    1: "Encoder Fault",
    2: "Peripheral Fault",
    3: "IO Expander Fault",
    4: "Low Battery Fault",
    5: "Limit Switch Fault",
    6: "Brush Motor Over Current Fault",
    7: "High Temperature Fault"
  };

  useEffect(() => {
    const fetchRobotData = async () => {
      try {
        const devicesResponse = await axios.get('http://localhost:5002/api/devices');
        const devices = devicesResponse.data.result;

        const robotErrors = [];

        for (const device of devices) {
          try {
            const deviceDataResponse = await axios.get(`http://localhost:5002/api/devices/${device.devEui}/data`);
            const ch7Data = deviceDataResponse.data.object?.CH7;

            if (ch7Data) {
              const errors = [];
              for (let i = 1; i <= 7; i++) {
                if ((ch7Data & (1 << (i - 1))) === 0) {
                  continue; // No error, skip to the next fault code
                }
                errors.push(faultCodes[i]);
              }

              if (errors.length > 0) {
                robotErrors.push({
                  robotName: device.name,
                  location:device.description, 
                  errors: errors,
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching data for device ${device.devEui}:`, error);
          }
        }

        setRobotData(robotErrors);
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    fetchRobotData();
  }, []);

  return (
    <div>
      <h2>Robot Errors</h2>
      {robotData.length === 0 ? (
        <p>No errors found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Robot Name</th>
              <th>Location</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {robotData.map((robot, index) => (
              <tr key={index}>
                <td>{robot.robotName}</td>
                <td>{robot.location}</td>
                <td>
                  <ul>
                    {robot.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>{error}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RobotErrors;