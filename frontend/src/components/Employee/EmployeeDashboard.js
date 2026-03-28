import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  IconButton,
  Tab,
  Tabs,
  Badge,
  Divider,
  Avatar,
  Tooltip,
  Zoom,
  Fade
} from '@mui/material';
import {
  Computer,
  Phone,
  Print,
  Mouse,
  Keyboard,
  Devices,
  Assignment,
  CheckCircle,
  Pending,
  Cancel,
  Visibility,
  Refresh,
  Add,
  Info,
  Inventory,
  RequestPage,
  ThumbUp,
  ThumbDown,
  HourglassEmpty,
  CheckCircleOutline
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
}));

const AssetIcon = styled(Box)(({ category }) => {
  const getColor = () => {
    switch(category) {
      case 'Laptop': return '#2196f3';
      case 'Desktop': return '#4caf50';
      case 'Monitor': return '#ff9800';
      case 'Printer': return '#f44336';
      case 'Phone': return '#9c27b0';
      case 'Tablet': return '#00bcd4';
      case 'Keyboard': return '#795548';
      case 'Mouse': return '#607d8b';
      default: return '#9c27b0';
    }
  };
  
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: '50%',
    backgroundColor: getColor(),
    color: 'white',
    marginBottom: 16,
  };
});

const StatusChip = styled(Chip)(({ status }) => ({
  fontWeight: 600,
  backgroundColor: 
    status === 'available' ? '#e8f5e8' :
    status === 'assigned' ? '#e3f2fd' :
    status === 'maintenance' ? '#fff3e0' : 
    status === 'pending' ? '#fff3e0' :
    status === 'approved' ? '#e8f5e8' :
    status === 'fulfilled' ? '#e3f2fd' :
    status === 'rejected' ? '#ffebee' : 
    status === 'cancelled' ? '#ffebee' : '#ffebee',
  color: 
    status === 'available' ? '#2e7d32' :
    status === 'assigned' ? '#1565c0' :
    status === 'maintenance' ? '#ef6c00' :
    status === 'pending' ? '#ed6c02' :
    status === 'approved' ? '#2e7d32' :
    status === 'fulfilled' ? '#1565c0' :
    status === 'rejected' ? '#c62828' : 
    status === 'cancelled' ? '#c62828' : '#c62828',
  '& .MuiChip-icon': {
    color: 'inherit'
  }
}));

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openAssetDialog, setOpenAssetDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestForm, setRequestForm] = useState({
    assetType: '',
    reason: '',
    priority: 'medium',
    comments: '' // Changed from additionalNotes to match schema
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Asset categories for request form
  const assetCategories = [
    'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse',
    'Printer', 'Phone', 'Tablet', 'Headset', 'Webcam', 'Other'
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    fetchData();
    // Set up auto-refresh every 30 seconds to check for status updates
    const interval = setInterval(() => {
      fetchData(true); // silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Fetch available assets
      const assetsRes = await api.get('/assets');
      setAssets(assetsRes.data.assets);
      
      // Fetch my requests
      const requestsRes = await api.get('/requests/my-requests');
      setMyRequests(requestsRes.data.requests);
      
      // Fetch my assigned assets
      try {
        const myAssetsRes = await api.get('/assets/my-assets');
        setMyAssets(myAssetsRes.data.assets);
      } catch (error) {
        // Fallback: filter from all assets
        const allAssetsRes = await api.get('/assets');
        const assignedAssets = allAssetsRes.data.assets.filter(
          asset => asset.assignedTo && asset.assignedTo._id === user?.id
        );
        setMyAssets(assignedAssets);
      }
      
      setLastUpdated(new Date());
      
      // Check for status changes and show notifications
      if (!silent && myRequests.length > 0) {
        const previousRequests = myRequests;
        const newRequests = requestsRes.data.requests;
        
        // Find any status changes
        newRequests.forEach(newReq => {
          const oldReq = previousRequests.find(r => r._id === newReq._id);
          if (oldReq && oldReq.status !== newReq.status) {
            // Status changed
            let message = '';
            if (newReq.status === 'fulfilled') {
              message = `Your request for ${newReq.assetType} has been approved and asset assigned!`;
            } else if (newReq.status === 'approved') {
              message = `Your request for ${newReq.assetType} has been approved!`;
            } else if (newReq.status === 'rejected') {
              message = `Your request for ${newReq.assetType} has been rejected.`;
            }
            if (message) {
              setSuccess(message);
              setTimeout(() => setSuccess(''), 5000);
            }
          }
        });
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!silent) setError('Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRequestChange = (e) => {
    setRequestForm({
      ...requestForm,
      [e.target.name]: e.target.value
    });
  };

  const handleRequestSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare request data - use 'comments' field to match schema
      const requestData = {
        assetType: requestForm.assetType,
        reason: requestForm.reason,
        priority: requestForm.priority,
        comments: requestForm.comments
      };
      
      const response = await api.post('/requests', requestData);
      
      if (response.data.success) {
        setSuccess('Request submitted successfully!');
        setOpenRequestDialog(false);
        setRequestForm({
          assetType: '',
          reason: '',
          priority: 'medium',
          comments: ''
        });
        fetchData(); // Refresh data
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        const response = await api.put(`/requests/${requestId}/cancel`);
        if (response.data.success) {
          setSuccess('Request cancelled successfully');
          fetchData();
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to cancel request');
      }
    }
  };

  const getAssetIcon = (category) => {
    switch(category) {
      case 'Laptop':
      case 'Desktop':
        return <Computer sx={{ fontSize: 30 }} />;
      case 'Phone':
        return <Phone sx={{ fontSize: 30 }} />;
      case 'Printer':
        return <Print sx={{ fontSize: 30 }} />;
      case 'Mouse':
        return <Mouse sx={{ fontSize: 30 }} />;
      case 'Keyboard':
        return <Keyboard sx={{ fontSize: 30 }} />;
      default:
        return <Devices sx={{ fontSize: 30 }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': 
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <HourglassEmpty fontSize="small" />;
      case 'approved':
        return <ThumbUp fontSize="small" />;
      case 'fulfilled':
        return <CheckCircleOutline fontSize="small" />;
      case 'rejected':
        return <ThumbDown fontSize="small" />;
      case 'cancelled':
        return <Cancel fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  };

  // StatCard component
  const StatCard = ({ title, value, icon, color }) => {
    const colorMap = {
      primary: { bg: '#e3f2fd', text: '#1976d2', icon: '#1976d2' },
      warning: { bg: '#fff3e0', text: '#ed6c02', icon: '#ed6c02' },
      success: { bg: '#e8f5e8', text: '#2e7d32', icon: '#2e7d32' },
      secondary: { bg: '#f3e5f5', text: '#9c27b0', icon: '#9c27b0' },
      error: { bg: '#ffebee', text: '#c62828', icon: '#c62828' },
      info: { bg: '#e3f2fd', text: '#0288d1', icon: '#0288d1' }
    };
    
    const colors = colorMap[color] || colorMap.primary;
    
    return (
      <Paper 
        sx={{ 
          p: 3, 
          height: '100%', 
          position: 'relative', 
          overflow: 'hidden',
          backgroundColor: colors.bg,
          color: colors.text,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8, color: colors.text }} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" fontWeight="bold" sx={{ color: colors.text }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 40, color: colors.icon } })}
          </Box>
        </Box>
      </Paper>
    );
  };

  if (loading && !assets.length) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Calculate stats
  const pendingRequests = myRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = myRequests.filter(r => r.status === 'approved').length;
  const fulfilledRequests = myRequests.filter(r => r.status === 'fulfilled').length;
  const rejectedRequests = myRequests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length;

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#1976d2' }}>
              Welcome back, {user?.firstName} {user?.lastName}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Employee ID: {user?.employeeId} • Department: {user?.department}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<RequestPage />}
            onClick={() => setOpenRequestDialog(true)}
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              }
            }}
          >
            Request New Asset
          </Button>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError('')}
            action={
              <Button color="inherit" size="small" onClick={() => fetchData()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Fade in={!!success}>
            <Alert 
              severity="success" 
              sx={{ mb: 3 }} 
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          </Fade>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="My Assets"
              value={myAssets.length}
              icon={<Inventory />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Requests"
              value={pendingRequests}
              icon={<Pending />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Approved/Fulfilled"
              value={approvedRequests + fulfilledRequests}
              icon={<CheckCircle />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Available Assets"
              value={assets.length}
              icon={<Devices />}
              color="secondary"
            />
          </Grid>
        </Grid>

        {/* Request Status Summary */}
        {(pendingRequests > 0 || approvedRequests > 0 || fulfilledRequests > 0 || rejectedRequests > 0) && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Typography variant="subtitle2" color="text.secondary">
                  Request Summary:
                </Typography>
              </Grid>
              {pendingRequests > 0 && (
                <Grid item>
                  <Chip
                    icon={<HourglassEmpty />}
                    label={`${pendingRequests} Pending`}
                    size="small"
                    sx={{ bgcolor: '#fff3e0', color: '#ed6c02' }}
                  />
                </Grid>
              )}
              {approvedRequests > 0 && (
                <Grid item>
                  <Chip
                    icon={<ThumbUp />}
                    label={`${approvedRequests} Approved`}
                    size="small"
                    sx={{ bgcolor: '#e8f5e8', color: '#2e7d32' }}
                  />
                </Grid>
              )}
              {fulfilledRequests > 0 && (
                <Grid item>
                  <Chip
                    icon={<CheckCircleOutline />}
                    label={`${fulfilledRequests} Fulfilled`}
                    size="small"
                    sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}
                  />
                </Grid>
              )}
              {rejectedRequests > 0 && (
                <Grid item>
                  <Chip
                    icon={<ThumbDown />}
                    label={`${rejectedRequests} Rejected`}
                    size="small"
                    sx={{ bgcolor: '#ffebee', color: '#c62828' }}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Tabs for different views */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab 
              label="My Assets" 
              icon={<Inventory />} 
              iconPosition="start"
            />
            <Tab 
              label={
                <Badge 
                  badgeContent={pendingRequests} 
                  color="error"
                  sx={{ '& .MuiBadge-badge': { right: -10 } }}
                >
                  My Requests
                </Badge>
              }
              icon={<Assignment />} 
              iconPosition="start"
            />
            <Tab 
              label="Available Assets" 
              icon={<Devices />} 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <Box sx={{ mt: 3 }}>
          {/* My Assets Tab */}
          {tabValue === 0 && (
            <Zoom in={tabValue === 0}>
              <Grid container spacing={3}>
                {myAssets.length > 0 ? (
                  myAssets.map((asset) => (
                    <Grid item xs={12} sm={6} md={4} key={asset._id}>
                      <StyledCard>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <AssetIcon category={asset.category}>
                              {getAssetIcon(asset.category)}
                            </AssetIcon>
                            <StatusChip
                              label={asset.condition}
                              size="small"
                              status={asset.condition}
                            />
                          </Box>
                          
                          <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: '#333' }}>
                            {asset.name}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {asset.category} • {asset.model || 'No model'}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ color: '#555' }}>
                              <strong>Asset Tag:</strong> {asset.assetTag}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#555' }}>
                              <strong>Serial:</strong> {asset.serialNumber || 'N/A'}
                            </Typography>
                            {asset.assignedDate && (
                              <Typography variant="body2" sx={{ color: '#555' }}>
                                <strong>Assigned:</strong> {new Date(asset.assignedDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Tooltip title="View Details">
                            <Button 
                              size="small" 
                              startIcon={<Visibility />}
                              onClick={() => {
                                setSelectedAsset(asset);
                                setOpenAssetDialog(true);
                              }}
                              sx={{ color: '#1976d2' }}
                            >
                              View Details
                            </Button>
                          </Tooltip>
                        </CardActions>
                      </StyledCard>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                      <Inventory sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No assets assigned to you yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Browse available assets and submit a request
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Devices />}
                        onClick={() => setTabValue(2)}
                        sx={{ mt: 2 }}
                      >
                        Browse Available Assets
                      </Button>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Zoom>
          )}

          {/* My Requests Tab */}
          {tabValue === 1 && (
            <Zoom in={tabValue === 1}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Request ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Asset Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Requested Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Admin Remarks</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myRequests.length > 0 ? (
                      myRequests.map((request) => (
                        <TableRow key={request._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#1976d2' }}>
                              {request.requestId}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: '#555' }}>{request.assetType}</TableCell>
                          <TableCell sx={{ color: '#555' }}>{request.reason}</TableCell>
                          <TableCell>
                            <Chip
                              label={request.priority}
                              color={getPriorityColor(request.priority)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <StatusChip
                              label={request.status}
                              size="small"
                              status={request.status}
                              icon={getStatusIcon(request.status)}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#555' }}>
                            {new Date(request.requestedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {request.adminRemarks ? (
                              <Tooltip title={request.adminRemarks}>
                                <IconButton size="small">
                                  <Info fontSize="small" sx={{ color: '#1976d2' }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => handleCancelRequest(request._id)}
                              >
                                Cancel
                              </Button>
                            )}
                            {request.status === 'fulfilled' && request.assignedAsset && (
                              <Button
                                size="small"
                                color="primary"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => {
                                  // Find the full asset details
                                  const asset = myAssets.find(a => a._id === request.assignedAsset._id);
                                  setSelectedAsset(asset || request.assignedAsset);
                                  setOpenAssetDialog(true);
                                }}
                              >
                                View Asset
                              </Button>
                            )}
                            {request.status === 'rejected' && (
                              <Typography variant="caption" color="error">
                                Rejected
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Assignment sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            No requests found
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setOpenRequestDialog(true)}
                            sx={{ mt: 2 }}
                          >
                            Request an Asset
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Zoom>
          )}

          {/* Available Assets Tab */}
          {tabValue === 2 && (
            <Zoom in={tabValue === 2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#333', fontWeight: 'bold' }}>
                      Available Assets ({assets.length})
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<RequestPage />}
                      onClick={() => setOpenRequestDialog(true)}
                    >
                      Request Asset
                    </Button>
                  </Box>
                </Grid>
                
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <Grid item xs={12} sm={6} md={4} key={asset._id}>
                      <StyledCard>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <AssetIcon category={asset.category}>
                              {getAssetIcon(asset.category)}
                            </AssetIcon>
                            <Chip
                              label="Available"
                              size="small"
                              color="success"
                            />
                          </Box>
                          
                          <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: '#333' }}>
                            {asset.name}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {asset.category} • {asset.model || 'No model'}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ color: '#555' }}>
                              <strong>Asset Tag:</strong> {asset.assetTag}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#555' }}>
                              <strong>Condition:</strong> {asset.condition}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#555' }}>
                              <strong>Location:</strong> {asset.location || 'N/A'}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Tooltip title="View Details">
                            <Button 
                              size="small" 
                              startIcon={<Visibility />}
                              onClick={() => {
                                setSelectedAsset(asset);
                                setOpenAssetDialog(true);
                              }}
                              sx={{ color: '#1976d2' }}
                            >
                              Details
                            </Button>
                          </Tooltip>
                          <Tooltip title="Request this asset">
                            <Button 
                              size="small" 
                              color="primary"
                              variant="contained"
                              startIcon={<Assignment />}
                              onClick={() => {
                                setRequestForm({
                                  ...requestForm,
                                  assetType: asset.category
                                });
                                setOpenRequestDialog(true);
                              }}
                            >
                              Request
                            </Button>
                          </Tooltip>
                        </CardActions>
                      </StyledCard>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                      <Devices sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No assets available at the moment
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Zoom>
          )}
        </Box>

        {/* Request Asset Dialog */}
        <Dialog 
          open={openRequestDialog} 
          onClose={() => setOpenRequestDialog(false)}
          maxWidth="sm"
          fullWidth
          TransitionComponent={Zoom}
        >
          <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              <Typography variant="h6" sx={{ color: '#333' }}>Request New Asset</Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ color: '#555' }}>Asset Type</InputLabel>
                  <Select
                    name="assetType"
                    value={requestForm.assetType}
                    onChange={handleRequestChange}
                    label="Asset Type"
                  >
                    {assetCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Reason for Request"
                  name="reason"
                  value={requestForm.reason}
                  onChange={handleRequestChange}
                  multiline
                  rows={3}
                  placeholder="Please explain why you need this asset"
                  InputLabelProps={{ sx: { color: '#555' } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ color: '#555' }}>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={requestForm.priority}
                    onChange={handleRequestChange}
                    label="Priority"
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Comments"
                  name="comments"
                  value={requestForm.comments}
                  onChange={handleRequestChange}
                  multiline
                  rows={2}
                  placeholder="Any additional information (optional)"
                  InputLabelProps={{ sx: { color: '#555' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenRequestDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRequestSubmit}
              variant="contained"
              disabled={!requestForm.assetType || !requestForm.reason || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Request'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Asset Details Dialog */}
        <Dialog
          open={openAssetDialog}
          onClose={() => setOpenAssetDialog(false)}
          maxWidth="sm"
          fullWidth
          TransitionComponent={Zoom}
        >
          {selectedAsset && (
            <>
              <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getAssetIcon(selectedAsset.category)}
                  <Typography variant="h6" sx={{ color: '#333' }}>{selectedAsset.name}</Typography>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Asset Tag
                    </Typography>
                    <Typography variant="body1" gutterBottom fontWeight="bold" sx={{ color: '#333' }}>
                      {selectedAsset.assetTag}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ color: '#555' }}>
                      {selectedAsset.category}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Model
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ color: '#555' }}>
                      {selectedAsset.model || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Serial Number
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ color: '#555' }}>
                      {selectedAsset.serialNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Condition
                    </Typography>
                    <StatusChip
                      label={selectedAsset.condition}
                      size="small"
                      status={selectedAsset.condition}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <StatusChip
                      label={selectedAsset.status}
                      size="small"
                      status={selectedAsset.status}
                    />
                  </Grid>
                  {selectedAsset.purchaseDate && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Purchase Date
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#555' }}>
                        {new Date(selectedAsset.purchaseDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                  {selectedAsset.warrantyExpiry && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Warranty Expiry
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#555' }}>
                        {new Date(selectedAsset.warrantyExpiry).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#555' }}>
                      {selectedAsset.location || 'Not specified'}
                    </Typography>
                  </Grid>
                  {selectedAsset.assignedTo && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Assigned To
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                          {selectedAsset.assignedTo.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#333' }}>
                            {selectedAsset.assignedTo.firstName} {selectedAsset.assignedTo.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedAsset.assignedTo.employeeId}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {selectedAsset.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notes
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f9f9f9' }}>
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          {selectedAsset.notes}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpenAssetDialog(false)}>Close</Button>
                {selectedAsset.status === 'available' && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setOpenAssetDialog(false);
                      setRequestForm({
                        ...requestForm,
                        assetType: selectedAsset.category
                      });
                      setOpenRequestDialog(true);
                    }}
                  >
                    Request This Asset
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Refresh Button */}
        <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <Tooltip title="Refresh Data">
            <IconButton
              color="primary"
              onClick={() => fetchData()}
              sx={{
                backgroundColor: 'white',
                boxShadow: 3,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Container>
    </Layout>
  );
};

export default EmployeeDashboard;