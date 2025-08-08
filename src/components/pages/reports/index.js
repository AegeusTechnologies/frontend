import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Container,
  Box,
  CircularProgress,
  Grid,
  Chip,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
//import RobotIcon from '@mui/icons-material/SmartToy';
import RobotIcon from '@mui/icons-material/SolarPowerTwoTone';
import axios from 'axios';
import { message, DatePicker } from 'antd';
const { RangePicker } = DatePicker;

const RobotReportDashboard = () => {
  const [reportType, setReportType] = useState('day');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [error, setError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchReportByRange = async (dates) => {
    setIsLoading(true);
    setError(null);
    try {
      const [start, end] = dates;
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/robot-cleaning-report`, {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD')
      });

      const data = response.data;

      if (data.success) {
        const sortedRobots = data.robots.sort((a, b) => {
          const numA = parseInt(a.robotName.replace(/\D/g, ""), 10);
          const numB = parseInt(b.robotName.replace(/\D/g, ""), 10);
          return numA - numB;
        });
  
        setReportData({ ...data, robots: sortedRobots });
      } else {
        setError('Invalid data format received from server');
      }
    } catch (error) {
      setError(`Error fetching report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      fetchReportByRange(dates);
    }
  };

  const fetchReportData = async (type) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/report/${type}`);
      
      const data = response.data;
      if (data.success) {
        const sortedRobots = data.robots.sort((a, b) => {
          const numA = parseInt(a.robotName.replace(/\D/g, ""), 10);
          const numB = parseInt(b.robotName.replace(/\D/g, ""), 10);
          return numA - numB;
        });
  
        setReportData({ ...data, robots: sortedRobots });
      } else {
        setError('Invalid data format received from server');
      }
    } catch (error) {
      setError(`Error fetching report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Download report as CSV - Fixed to show total panels cleaned only once
  const downloadReport = () => {
    if (!reportData) return;

    try {
      // Prepare CSV content
      const headers = ['Robot Name','Block and Row' ,'Panels Cleaned', 'Contribution %'];
      let csvRows = reportData.robots.map(robot => [
        robot.robotName,
        robot.block,
        robot.totalPanelsCleaned,
        robot.contributionPercentage
      ]);
      
      // Add a total summary row at the end
      csvRows.push(['', '', '','']);  // Empty row as separator
      csvRows.push(['Total Panels Cleaned', reportData.totalPanelsCleaned]);

      // Create CSV string
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const date = new Date();
      
      // Include period information in filename
      const periodInfo = reportData.year
  ? `year_${date.getFullYear()}` // 2025
  : reportData.month
    ? `month_${date.getMonth() + 1}/${date.getFullYear()}` 
    : `day_${date.getUTCDate()}/${date.getMonth() + 1}/${date.getFullYear()}`; /
    
      link.setAttribute('download', `robot_report_${periodInfo}.csv`);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      setError(`Error downloading report: ${error.message}`);
    }
  };

  // Fetch data on component mount and when report type changes
  useEffect(() => {
    fetchReportData(reportType);
  }, [reportType]);

  // Format period text based on available data
  const getPeriodText = () => {
    if (!reportData) return 'Current Period';
    
    if (reportData.year) return `Year: ${reportData.year}`;
    if (reportData.month) {
      const date = new Date(reportData.month);
      return `Month: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
    }
    if (reportData.day) {
      const date = new Date(reportData.day);
      return `Day: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    }
    
    return 'Current Period';
  };

  // Calculate highest performing robot
  const getTopPerformer = () => {
    if (!reportData || !reportData.robots || reportData.robots.length === 0) return null;
    
    return reportData.robots.reduce((max, robot) => 
      parseInt(robot.totalPanelsCleaned) > parseInt(max.totalPanelsCleaned) ? robot : max, 
      reportData.robots[0]
    );
  }

  return (
    <Container maxWidth="lg">
      <Card sx={{ mt: 4, mb: 4, borderRadius: 3, boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)', overflow: 'visible' }}>
        <CardHeader
          title={
            <Box sx={{ mb: 1 }}>
              <Typography variant="h4" color="primary" fontWeight="600">
                <RobotIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Robot Cleaning Report
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                View and analyze robot cleaning performance
              </Typography>
            </Box>
          }
        />
        
        <Divider />
        
        <Box sx={{ px: 3, py: 2, backgroundColor: '#f9f9f9' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                  startAdornment={<BarChartIcon sx={{ mr: 1, color: '#666' }} />}
                >
                  <MenuItem value="yearly">Yearly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="day">Daily</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ mr: 1, color: '#666' }} />
                <RangePicker 
                  onChange={handleDateRangeChange}
                  value={dateRange}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Tooltip title="Download report as CSV file">
                <Button
                  variant="contained"
                  fullWidth
                  onClick={downloadReport}
                  disabled={!reportData || isLoading}
                  startIcon={<FileDownloadIcon />}
                  sx={{
                    backgroundColor: '#2e7d32',
                    '&:hover': {
                      backgroundColor: '#1b5e20',
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0',
                    },
                  }}
                >
                  Export Report
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
        
        <CardContent sx={{ pt: 3 }}>
          {downloadSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Report downloaded successfully!
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={6}>
              <CircularProgress color="primary" />
            </Box>
          ) : reportData ? (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: '#f3f8ff', height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">TOTAL PANELS CLEANED</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#1565c0" sx={{ mt: 1 }}>
                      {reportData.totalPanelsCleaned.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Period: {getPeriodText()}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: '#f5fff5', height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">ACTIVE ROBOTS</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#2e7d32" sx={{ mt: 1 }}>
                      {reportData.robots.length}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Working together to clean panels
                    </Typography>
                  </Paper>
                </Grid>
                
                {getTopPerformer() && (
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: '#fffcf0', height: '100%' }}>
                      <Typography variant="subtitle2" color="text.secondary">TOP PERFORMER</Typography>
                      <Typography variant="h4" fontWeight="bold" color="#ed6c02" sx={{ mt: 1 }}>
                        {getTopPerformer().robotName}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Cleaned {getTopPerformer().totalPanelsCleaned.toLocaleString()} panels ({getTopPerformer().contributionPercentage})
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
              
              <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">
                Performance Breakdown
              </Typography>
              
              <TableContainer component={Paper} sx={{ boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.05)', borderRadius: 2 }}>
                <Table aria-label="robot cleaning report table">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Robot Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }} align="center">Blocks and Rows</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }} align="right">Panels Cleaned</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }} align="right">Contribution</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }} align="center">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.robots.map((robot, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <RobotIcon sx={{ mr: 1, color: '#757575' }} />
                            {robot.robotName}
                          </Box>
                        </TableCell>
                        <TableCell align="center">{robot.block}</TableCell>
                        <TableCell align="right">{robot.totalPanelsCleaned.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={robot.contributionPercentage} 
                            size="small" 
                            sx={{ 
                              backgroundColor: parseFloat(robot.contributionPercentage) > 30 ? '#e3f2fd' : '#f5f5f5',
                              color: parseFloat(robot.contributionPercentage) > 30 ? '#0d47a1' : 'inherit',
                              fontWeight: parseFloat(robot.contributionPercentage) > 30 ? 'bold' : 'normal'
                            }} 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ 
                            width: '100%', 
                            height: 8, 
                            backgroundColor: '#f0f0f0', 
                            borderRadius: 4,
                            overflow: 'hidden'
                          }}>
                            <Box sx={{ 
                              height: '100%', 
                              width: `${parseFloat(robot.contributionPercentage)}%`, 
                              backgroundColor: parseFloat(robot.contributionPercentage) > 30 ? '#1976d2' : '#90caf9',
                              borderRadius: 4
                            }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No report data available. Please select a different time period.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default RobotReportDashboard;