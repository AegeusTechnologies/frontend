import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'antd';

import HomeIcon from '@mui/icons-material/Home';
import MemoryIcon from '@mui/icons-material/Memory';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import BatteryCharging90Icon from '@mui/icons-material/BatteryCharging90';

const SideMenu = ({ collapsed, onCollapse, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const toggleCollapsed = () => {
    onCollapse(!collapsed);
  };

  const menuItems = [
    { label: 'Home', key: '/', icon: <HomeIcon /> },
    { label: 'Robots', key: '/devices', icon: <MemoryIcon /> },
    { label: 'Scheduler', key: '/multicast', icon: <ScheduleIcon /> },
    { label: 'Robot Status', key: '/robotStatus', icon: <SmartToyIcon /> },
    { label : 'Battery Status', key: '/batteryStatus', icon: <BatteryCharging90Icon /> },
    { label: 'Configuration', key: '/configuration', icon: <SettingsIcon /> },
    { label: 'Fault Log', key: '/robotErrors', icon: <WarningAmberIcon /> },
    {label: 'RunningStatus', key: '/RunningStaus', icon: <SystemUpdateAltIcon /> },
    { label: 'Availability', key: '/avalability', icon: <PieChartIcon /> },
    { label: 'Reports', key: '/reports', icon: <BarChartIcon /> },
    { label: 'Logout', key: 'logout', icon: <LogoutIcon />, onClick: onLogout },
  ];

  const handleMenuClick = (item) => {
    if (item.key !== 'logout') {
      navigate(item.key);
    }
  };

  return (
    <div
      style={{
        width: collapsed ? '80px' : '250px',
        backgroundColor: '#F5F5F5',
        height: '100vh',
        transition: 'width 0.3s ease',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Toggle Collapse Button */}
      <div
        onClick={toggleCollapsed}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '8px',
          cursor: 'pointer',
          zIndex: 1,
        }}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
      >
        {collapsed ? (
          <MenuIcon style={{ fontSize: '24px', color: '#0DB39E' }} />
        ) : (
          <MenuOpenIcon style={{ fontSize: '24px', color: '#0DB39E' }} />
        )}
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        onClick={handleMenuClick}
        style={{
          marginTop: '50px',
          backgroundColor: 'transparent',
          border: 'none',
          flex: 1,
        }}
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.key;
          const isHovered = hoveredItem === item.key;
          const backgroundColor = isActive
            ? '#0DB39E'
            : isHovered
            ? 'rgba(13, 179, 158, 0.1)'
            : 'transparent';

          const iconColor = isActive
            ? '#fff'
            : isHovered
            ? '#0DB39E'
            : '#8C8C8C';

          return (
            <Menu.Item
              key={item.key}
              style={{
                margin: '8px 16px',
                borderRadius: '8px',
                backgroundColor,
                padding: '10px 16px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={item.onClick || (() => {})}
            >
              {React.cloneElement(item.icon, {
                style: {
                  color: iconColor,
          fontSize: '20px',
          transition: 'color 0.3s ease',
          marginRight: !collapsed ? '12px' : '0',
                },
              })}
              {!collapsed && (
                <span
                style={{
                  color: isActive ? 'white' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                  marginLeft: collapsed ? '12px' : '0',
                  transition: 'opacity 0.3s ease',
                  opacity: collapsed && !isHovered ? 0 : 1,
                }}
              >
                {item.label}
              </span>
              )}
            </Menu.Item>
          );
        })}
      </Menu>
    </div>
  );
};

export default SideMenu;
