import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Typography, 
  Box,
  CircularProgress,
  Alert,
  Chip,
  Container
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
});

const RobotErrors = () => {
  const [errorData, setErrorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const faultCodes = {
    0: "No Error",
    1: "Encoder Fault",
    2: "Peripheral Fault",
    3: "IO Expander Fault",
    4: "Low Battery Fault",
    5: "Limit Switch Fault",
    6: "Brush Motor Over Current Fault",
    7: "High Temperature Fault",
    10: "ERR_ROBOT_STALL - Robot stalled (no encoder pulses)",
    11: "ERR_STALL_RECOVERY - Robot Stall Recovery Failed",
    12: "ERR_BATTERY_LOW - Low battery condition",
    13: "ERR_OVER_TEMP_MCU - Over temperature condition of the MCU",
    14: "ERR_OVER_TEMP_PCB - Over temperature condition of the PCB",
    16: "ERR_INVALID_COMMAND - Invalid command received",
    17: "ERR_DRIVE_FAULT - Drive motor fault detected",
    18: "ERR_BRUSH_FAULT - Brush motor fault detected"
  };

  const fetchErrorData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5002/api/robot-error`);
      const result = await response.json();
      
      if (result.success) {
        setErrorData(result.data);
        setError(null);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorData();
  }, []);

  const downloadCSV = () => {
    // Create CSV content
    const headers = ['Robot Name','Error Description', 'Date'];
    
    const csvRows = [
      headers.join(','),
      ...errorData.map(item => [
        item.robotName,
        faultCodes[item.error] || 'Unknown Error',
        item.timestamp
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `robot_errors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Determine severity level based on error code
  const getSeverity = (errorCode) => {
    if (errorCode === 0) return 'success';
    if (errorCode <= 2) return 'warning';
    if (errorCode <= 5) return 'error';
    return 'error'; // 6-7 are critical errors
  };

  const getChipColor = (errorCode) => {
    const severity = getSeverity(errorCode);
    if (severity === 'success') return 'success';
    if (severity === 'warning') return 'warning';
    return 'error';
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom>
              <Box display="flex" alignItems="center">
                <ErrorOutlineIcon sx={{ mr: 1 }} />
                Robot Error Dashboard
              </Box>
            </Typography>
            
            <Box>
              {/* <Button 
                variant="contained" 
                color="primary" 
                startIcon={<RefreshIcon />} 
                onClick={fetchErrorData}
                sx={{ mr: 2 }}
              >
                Refresh
              </Button>
               */}
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<DownloadIcon />} 
                onClick={downloadCSV}
                disabled={errorData.length === 0}
              >
                Export CSV
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : errorData.length === 0 ? (
            <Alert severity="info">No error data available</Alert>
          ) : (
            <TableContainer component={Paper} elevation={3}>
              <Table sx={{ minWidth: 650 }} aria-label="robot errors table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell><Typography fontWeight="bold">Robot Name</Typography></TableCell>
                    {/* <TableCell><Typography fontWeight="bold">Error Status</Typography></TableCell> */}
                    <TableCell><Typography fontWeight="bold">Error Description</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Timestamp</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorData.map((row, index) => (
                    <TableRow 
                      key={index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography variant="body1">{row.robotName}</Typography>
                      </TableCell>
                      {/* <TableCell>
                        <Chip 
                          label={`Error ${row.error}`} 
                          color={getChipColor(row.error)}
                          size="small"
                        />
                      </TableCell> */}
                      <TableCell>
                        <Typography>{faultCodes[row.error] || 'Unknown Error'}</Typography>
                      </TableCell>
                      <TableCell>{row.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default RobotErrors;
