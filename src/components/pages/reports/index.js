import React, { useState, useEffect } from 'react';
import {
  CardContent,
  CardHeader,
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
  Typography
} from '@mui/material';

import {
  Card,
  Tag,
  Space,
  Divider
} from 'antd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RobotIcon from '@mui/icons-material/SolarPowerTwoTone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { message, DatePicker } from 'antd';

const { Title, Text } = Typography;
const { MonthPicker } = DatePicker;
const { RangePicker } = DatePicker;

const getCleaningColor = (count) => {
  if (count === 0) return 'default';
  if (count < 500) return 'warning';
  if (count < 1000) return 'cyan';
  return 'green';
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

const RobotReportDashboard = () => {
  const [reportType, setReportType] = useState('day');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [error, setError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [Month, SetMonth] = useState(null);
  const [MonthlyReport, SetMonthlyReport] = useState(null);

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

  const downloadExcel = () => {
    if (!MonthlyReport || !MonthlyReport.robots || !MonthlyReport.days) {
      console.error("MonthlyReport data is not ready yet.");
      return;
    }
  
    
    const { robots, days, month } = MonthlyReport;
  
    const rows = robots.map(robot => {
      const row = { "Robot Name": robot.robotName };
      days.forEach(day => {
        row[day] = robot.dailyCleaning[day] ?? 0;
      });
      return row;
    });
  
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ["Robot Name", ...days],
    });
  
    worksheet['!cols'] = [{ wch: 15 }, ...days.map(() => ({ wch: 10 }))];
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
  
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
  
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  
    saveAs(blob, `Robot_Monthly_Report_${month}.xlsx`);
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

  const handleDetailMonthlyReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/report/monthly-daily`, { month: Month });
      const data = response.data;

     if (data.success) {
    const sortedRobots = data.robots.sort((a, b) => {
      const numA = parseInt(a.robotName.replace(/\D/g, ""), 10);
      const numB = parseInt(b.robotName.replace(/\D/g, ""), 10);
      return numA - numB;
    });
    
        SetMonthlyReport({ ...data, robots: sortedRobots });

        message.success("Monthly report fetched successfully");
      }
    } catch (error) {
      setError(`Error fetching report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;
  
    try {
      const headers = ['Robot Name', 'Block and Row', 'Panels Cleaned', 'Contribution %'];
  
      const dataRows = reportData.robots.map(robot => [
        robot.robotName,
        robot.block,
        robot.totalPanelsCleaned,
        robot.contributionPercentage
      ]);
  
      // Add empty row and total at the end
      dataRows.push(['', '', '', '']);
      dataRows.push(['','Total Panels Cleaned', reportData.totalPanelsCleaned, '']);
  
      // Combine headers and data into one array
      const sheetData = [headers, ...dataRows];
  
      // Create worksheet and set column widths
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      worksheet['!cols'] = [
        { wch: 20 }, // Robot Name
        { wch: 20 }, // Block and Row
        { wch: 18 }, // Panels Cleaned
        { wch: 18 }, // Contribution %
      ];
  
      // Create workbook and append sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Robot Report');
  
      // Write workbook to binary Excel format
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
  
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
  
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
  
      // Determine period info from reportData
      const date = new Date();
      const periodInfo = reportData.year
        ? `year_${date.getFullYear()}`
        : reportData.month
        ? `month_${date.getMonth() + 1}_${date.getFullYear()}`
        : `day_${date.getUTCDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
  
      link.download = `robot_report_${periodInfo}.xlsx`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      setError(`Error downloading report: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchReportData(reportType);
  }, [reportType]);

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

  const getTopPerformer = () => {
    if (!reportData || !reportData.robots || reportData.robots.length === 0) return null;

    return reportData.robots.reduce((max, robot) =>
      parseInt(robot.totalPanelsCleaned) > parseInt(max.totalPanelsCleaned) ? robot : max,
      reportData.robots[0]
    );
  };

  return (
    <Container maxWidth="lg" overflow="visible" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ mt: 2, mb: 2, borderRadius: 3, boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)', overflow: 'visible' }}>
        <CardHeader
  title={
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap', 
      }}
    >
   
      <Box>
        <Typography variant="h4" color="primary" fontWeight="600">
          <RobotIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Robot Cleaning Report
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
          View and analyze robot cleaning performance
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2, 
          mt: { xs: 2, md: 0 }, 
        }}
      >
        <MonthPicker
          onChange={(date, dateString) => SetMonth(dateString)}
          placeholder="Select month"
        />

        <Tooltip title="View detailed monthly report of all Robots">
  <Button
          variant="outlined"
          onClick={handleDetailMonthlyReport}
        >
          Monthly Reports
        </Button>

        </Tooltip>
      </Box>
    </Box>
  }
/>
  <Divider />
         
        {MonthlyReport ? (
        isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={6}>
          {/* You can add a loading spinner or text here */}
          <Typography>Loading...</Typography>
        </Box>
        ):
          <Box>
            <div className="flex items-center justify-between mb-4">
  <Typography variant="h5">Monthly Report View</Typography>
  <Button
    onClick={downloadExcel}
    startIcon={<FileDownloadIcon />}
    variant="contained"
    color="primary"
  >
    Download
  </Button>
</div>

<Button
  variant="outlined"
  onClick={() => SetMonthlyReport(null)}
  className="mb-4"
>
  ← Back
</Button>

          
<TableContainer component={Paper} sx={{ mt: 3 }}>
  <Table stickyHeader>
    <TableHead>
      <TableRow>
        <TableCell
          sx={{ border: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
        >
          Robot Name
        </TableCell>
        {MonthlyReport.days.map(day => (
          <TableCell
            key={day}
            align="center"
            sx={{ border: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
          >
            {day.split('-')[2]}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>

    <TableBody>
      {MonthlyReport.robots.map(robot => (
        <TableRow key={robot.robotId}>
          <TableCell sx={{ border: '1px solid #ddd' }}>{robot.robotName}</TableCell>
          {MonthlyReport.days.map(day => (
            <TableCell key={day} align="center" sx={{ border: '1px solid #ddd' }}>
              <Tag color={getCleaningColor(robot.dailyCleaning[day])}>
                {robot.dailyCleaning[day] === 0
                  ? '0'
                  : formatNumber(robot.dailyCleaning[day])}
              </Tag>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

          </Box>
        )  : (
  <>
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
              '&:hover': { backgroundColor: '#1b5e20' },
              '&:disabled': { backgroundColor: '#e0e0e0' },
              
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

        </>
)}

      </Card>
    </Container>

    
  );
};

export default RobotReportDashboard;