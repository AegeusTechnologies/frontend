import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    HistoryToggleOff,
    WaterDrop,
    WbSunny,
    WindPower
} from '@mui/icons-material';
import AirIcon from '@mui/icons-material/Air';
import { Umbrella } from 'lucide-react';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

function AppHeader() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [localTime, setLocalTime] = useState('');

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/weatherData`);
                if (response.data && response.data.success && response.data.data) {
                    setWeatherData(response.data.data);
                    setError(null);
                } else {
                    // If no data or success is false, set all values to zero and warning state
                    setWeatherData({
                        wind_direction_angle: 0,
                        wind_speed_level: 0,
                        rain_gauge: 0,
                        wind_speed: 0,
                        wind_direction: 'N/A'
                    });
                    setError("No weather data available");
                }
                setLoading(false);
            } catch (err) {
                setWeatherData({
                    wind_direction_angle: 0,
                    wind_speed_level: 0,
                    rain_gauge: 0,
                    wind_speed: 0,
                    wind_direction: 'N/A'
                });
                setError("Failed to fetch weather details. Please try again.");
                setLoading(false);
            }
        };

       setInterval(fetchWeatherData, 1000);


        const updateTime = () => {
            const now = new Date();
            setLocalTime(now.toLocaleTimeString());
        };
        const timerId = setInterval(updateTime, 1000);

        return () => clearInterval(timerId);
    }, []);

    const renderLoadingWeather = () => (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
        }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Fetching weather...</span>
        </div>
    );

    const renderWeatherDetails = () => {
        const {
            wind_direction_angle = 0,
            wind_speed_level = 0,
            rain_gauge = 0,
            wind_speed = 0,
            wind_direction = 'N/A'
        } = weatherData || {};

        // Show warning color if error is set
        const warning = !!error;

        return (
            <div style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                backgroundColor: warning ? '#fffbe6' : '#f5f5f5',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: warning ? '1px solid #ff9800' : undefined
            }}>
                <span style={{ display: 'flex', alignItems: 'center', color: warning ? '#ff9800' : 'orange' }}>
                    <AirIcon style={{ marginRight: '5px', color: warning ? '#ff9800' : 'orange' }} />
                    Wind Dir: {wind_direction} ({wind_direction_angle}°)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', color: warning ? '#ff9800' : 'blue' }}>
                    <RocketLaunchIcon style={{ marginRight: '5px', color: warning ? '#ff9800' : 'blue' }} />
                    Wind Speed: {wind_speed} m/s (Level {wind_speed_level})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', color: warning ? '#ff9800' : 'indigo' }}>
                    <Umbrella style={{ marginRight: '5px' }} />
                    Rain: {rain_gauge} mm
                </span>
                <span style={{ display: 'flex', alignItems: 'center', color: 'gray' }}>
                    <HistoryToggleOff style={{ marginRight: '5px' }} />
                    {localTime}
                </span>
            </div>
        );
    };

    const renderError = () => (
        <div style={{ color: 'red', backgroundColor: '#ffeeee', padding: '10px', borderRadius: '8px' }}>
            {error}
        </div>
    );

    const renderPlaceholder = () => (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            color: '#999', 
            textAlign: 'center' 
        }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.343-5.657L5.636 5.636m12.728 12.728L18.364 18.364M12 7a5 5 0 110 10 5 5 0 010-10z" />
            </svg>
            <span>Weather data unavailable</span>
        </div>
    );

    return (
        <div className="AppHeader" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '15px 30px', // Increased padding
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            backgroundColor: 'white'
        }}>
            <img
                src="https://aegeustechnologies.com/wp-content/uploads/2020/06/Aegeus-Technologies-logo.png"
                alt="Aegeus Technologies Logo"
                style={{ 
                    width: '140px', 
                    height: 'auto' 
                }}
            />

            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                flex: 1, 
                margin: '0 20px' 
            }}>
                {loading
                    ? renderLoadingWeather()
                    : error
                    ? renderError()
                    : weatherData
                    ? renderWeatherDetails()
                    : renderPlaceholder()}
            </div>

            {/* Placeholder for potential future right-side content */}
            <div style={{ width: '140px' }}></div>
        </div>
    );
}

export default AppHeader;
