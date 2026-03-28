import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
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
  Avatar,
  Divider,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  Assignment,
  People,
  CheckCircle,
  Cancel,
  Pending,
  Visibility,
  Refresh,
  Done,
  Close,
  Computer,
  Phone,
  Print
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

// Styled components
const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%'
  }
}));

const StatusChip = styled(Chip)(({ status }) => ({
  fontWeight: 600,
  backgroundColor: 
    status === 'pending' ? '#fff3e0' :
    status === 'approved' ? '#e8f5e8' :
    status === 'fulfilled' ? '#e3f2fd' :
    status === 'rejected' ? '#ffebee' : 
    status === 'cancelled' ? '#ffebee' : '#fff3e0',
  color: 
    status === 'pending' ? '#ed6c02' :
    status === 'approved' ? '#2e7d32' :
    status === 'fulfilled' ? '#1565c0' :
    status === 'rejected' ? '#c62828' : 
    status === 'cancelled' ? '#c62828' : '#ed6c02',
}));

const PriorityChip = styled(Chip)(({ priority }) => ({
  fontWeight: 600,
  backgroundColor: 
    priority === 'low' ? '#e8f5e8' :
    priority === 'medium' ? '#fff3e0' :
    priority === 'high' ? '#ffebee' :
    priority === 'urgent' ? '#fce4ec' : '#fff3e0',
  color: 
    priority === 'low' ? '#2e7d32' :
    priority === 'medium' ? '#ed6c02' :
    priority === 'high' ? '#c62828' :
    priority === 'urgent' ? '#c2185b' : '#ed6c02',
}));

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processForm, setProcessForm] = useState({
    status: 'approved',
    adminRemarks: '',
    assignedAsset: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all requests
      const requestsRes = await api.get('/requests');
      setRequests(requestsRes.data.requests);
      
      // Fetch all assets for assignment
      const assetsRes = await api.get('/assets');
      setAssets(assetsRes.data.assets);
      
      // Calculate stats
      const pending = requestsRes.data.requests.filter(r => r.status === 'pending').length;
      const approved = requestsRes.data.requests.filter(r => r.status === 'approved' || r.status === 'fulfilled').length;
      const rejected = requestsRes.data.requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length;
      
      const available = assetsRes.data.assets.filter(a => a.status === 'available').length;
      const assigned = assetsRes.data.assets.filter(a => a.status === 'assigned').length;
      
      setStats({
        totalRequests: requestsRes.data.requests.length,
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        totalAssets: assetsRes.data.assets.length,
        availableAssets: available,
        assignedAssets: assigned
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async () => {
    try {
      setLoading(true);
      
      const response = await api.put(`/requests/${selectedRequest._id}/process`, {
        status: processForm.status,
        adminRemarks: processForm.adminRemarks,
        assignedAsset: processForm.status === 'approved' ? processForm.assignedAsset : null
      });
      
      if (response.data.success) {
        setSuccess(`Request ${processForm.status} successfully!`);
        setOpenProcessDialog(false);
        setProcessForm({
          status: 'approved',
          adminRemarks: '',
          assignedAsset: ''
        });
        fetchDashboardData();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const getAssetIcon = (category) => {
    switch(category) {
      case 'Laptop':
      case 'Desktop':
        return <Computer />;
      case 'Phone':
        return <Phone />;
      case 'Printer':
        return <Print />;
      default:
        return <Inventory />;
    }
  };

  const filteredRequests = tabValue === 0 
    ? requests 
    : tabValue === 1 
      ? requests.filter(r => r.status === 'pending')
      : tabValue === 2
        ? requests.filter(r => r.status === 'approved' || r.status === 'fulfilled')
        : requests.filter(r => r.status === 'rejected' || r.status === 'cancelled');

  if (loading && !requests.length) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#1976d2' }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.firstName}! Manage asset requests and inventory
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <CardContent>
              <Typography color="inherit" gutterBottom variant="body2">
                  Total Requests
                </Typography>
                <Typography variant="h3" component="div" fontWeight="bold">
                  {stats.totalRequests}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip size="small" label={`${stats.pendingRequests} Pending`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip size="small" label={`${stats.approvedRequests} Approved`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)' }}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">
                  Pending Requests
                </Typography>
                <Typography variant="h3" component="div" fontWeight="bold">
                  {stats.pendingRequests}
                </Typography>
                <Button 
                  size="small" 
                  sx={{ mt: 2, color: 'white', borderColor: 'white' }} 
                  variant="outlined"
                  onClick={() => setTabValue(1)}
                >
                  View Pending
                </Button>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)' }}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">
                  Total Assets
                </Typography>
                <Typography variant="h3" component="div" fontWeight="bold">
                  {stats.totalAssets}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip size="small" label={`${stats.availableAssets} Available`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip size="small" label={`${stats.assignedAssets} Assigned`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)' }}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">
                  Available Assets
                </Typography>
                <Typography variant="h3" component="div" fontWeight="bold">
                  {stats.availableAssets}
                </Typography>
                <Button 
                  size="small" 
                  sx={{ mt: 2, color: 'white', borderColor: 'white' }} 
                  variant="outlined"
                  onClick={() => navigate('/admin/assets')}
                >
                  Manage Assets
                </Button>
              </CardContent>
            </StatCard>
          </Grid>
        </Grid>

        {/* Requests Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab 
              label="All Requests" 
              icon={<Assignment />} 
              iconPosition="start"
            />
            <Tab 
              label={
                <Badge badgeContent={stats.pendingRequests} color="error">
                  Pending
                </Badge>
              }
              icon={<Pending />} 
              iconPosition="start"
            />
            <Tab 
              label="Approved" 
              icon={<CheckCircle />} 
              iconPosition="start"
            />
            <Tab 
              label="Rejected/Cancelled" 
              icon={<Cancel />} 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Requests Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Request ID</strong></TableCell>
                <TableCell><strong>Employee</strong></TableCell>
                <TableCell><strong>Asset Type</strong></TableCell>
                <TableCell><strong>Reason</strong></TableCell>
                <TableCell><strong>Priority</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Requested Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#1976d2' }}>
                        {request.requestId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                          {request.employee?.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {request.employee?.firstName} {request.employee?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.employee?.employeeId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{request.assetType}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {request.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <PriorityChip
                        label={request.priority}
                        size="small"
                        priority={request.priority}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        label={request.status}
                        size="small"
                        status={request.status}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.requestedDate), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRequest(request);
                            setOpenViewDialog(true);
                          }}
                          title="View Details"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        
                        {request.status === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedRequest(request);
                                setProcessForm({
                                  ...processForm,
                                  status: 'approved'
                                });
                                setOpenProcessDialog(true);
                              }}
                              title="Approve Request"
                            >
                              <Done fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedRequest(request);
                                setProcessForm({
                                  ...processForm,
                                  status: 'rejected'
                                });
                                setOpenProcessDialog(true);
                              }}
                              title="Reject Request"
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        
                        {request.assignedAsset && (
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => {
                              // Navigate to asset details
                              navigate(`/admin/assets`);
                            }}
                            title="View Assigned Asset"
                          >
                            <Inventory fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No requests found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Process Request Dialog */}
        <Dialog
          open={openProcessDialog}
          onClose={() => setOpenProcessDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {processForm.status === 'approved' ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
              <Typography variant="h6">
                {processForm.status === 'approved' ? 'Approve Request' : 'Reject Request'}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedRequest && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Request Details
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body2">
                      <strong>Request ID:</strong> {selectedRequest.requestId}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Employee:</strong> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Asset Type:</strong> {selectedRequest.assetType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Reason:</strong> {selectedRequest.reason}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Priority:</strong> {selectedRequest.priority}
                    </Typography>
                  </Paper>
                </Grid>

                {processForm.status === 'approved' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Select Asset to Assign</InputLabel>
                      <Select
                        value={processForm.assignedAsset}
                        onChange={(e) => setProcessForm({ ...processForm, assignedAsset: e.target.value })}
                        label="Select Asset to Assign"
                      >
                        {assets
                          .filter(asset => 
                            asset.status === 'available' && 
                            asset.category === selectedRequest.assetType
                          )
                          .map(asset => (
                            <MenuItem key={asset._id} value={asset._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getAssetIcon(asset.category)}
                                <Box>
                                  <Typography variant="body2">
                                    {asset.name} - {asset.assetTag}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {asset.model} • {asset.condition}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                      </Select>
                      {assets.filter(asset => 
                        asset.status === 'available' && 
                        asset.category === selectedRequest.assetType
                      ).length === 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          No available assets of type {selectedRequest.assetType}. Please add assets first.
                        </Alert>
                      )}
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Admin Remarks"
                    multiline
                    rows={3}
                    value={processForm.adminRemarks}
                    onChange={(e) => setProcessForm({ ...processForm, adminRemarks: e.target.value })}
                    placeholder="Add any remarks or comments about this decision"
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenProcessDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleProcessRequest}
              disabled={
                loading || 
                (processForm.status === 'approved' && !processForm.assignedAsset)
              }
              color={processForm.status === 'approved' ? 'success' : 'error'}
            >
              {loading ? <CircularProgress size={24} /> : processForm.status === 'approved' ? 'Approve & Assign' : 'Reject Request'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Request Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedRequest && (
            <>
              <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assignment />
                  <Typography variant="h6">Request Details - {selectedRequest.requestId}</Typography>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Employee Information
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#1976d2' }}>
                          {selectedRequest.employee?.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedRequest.employee?.employeeId} • {selectedRequest.employee?.department}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedRequest.employee?.email}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedRequest.employee?.phoneNumber}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Request Information
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Asset Type
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedRequest.assetType}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Priority
                          </Typography>
                          <PriorityChip
                            label={selectedRequest.priority}
                            size="small"
                            priority={selectedRequest.priority}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <StatusChip
                            label={selectedRequest.status}
                            size="small"
                            status={selectedRequest.status}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Requested Date
                          </Typography>
                          <Typography variant="body2">
                            {format(new Date(selectedRequest.requestedDate), 'dd MMM yyyy, hh:mm a')}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Reason
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f9f9f9' }}>
                            <Typography variant="body2">
                              {selectedRequest.reason}
                            </Typography>
                          </Paper>
                        </Grid>
                        {selectedRequest.comments && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Additional Comments
                            </Typography>
                            <Typography variant="body2">
                              {selectedRequest.comments}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>

                  {selectedRequest.processedBy && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Processing Information
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Processed By
                            </Typography>
                            <Typography variant="body2">
                              {selectedRequest.processedBy?.firstName} {selectedRequest.processedBy?.lastName}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Processed Date
                            </Typography>
                            <Typography variant="body2">
                              {selectedRequest.processedDate && format(new Date(selectedRequest.processedDate), 'dd MMM yyyy, hh:mm a')}
                            </Typography>
                          </Grid>
                          {selectedRequest.adminRemarks && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                Admin Remarks
                              </Typography>
                              <Typography variant="body2">
                                {selectedRequest.adminRemarks}
                              </Typography>
                            </Grid>
                          )}
                          {selectedRequest.assignedAsset && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                Assigned Asset
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                {getAssetIcon(selectedRequest.assignedAsset.category)}
                                <Box>
                                  <Typography variant="body2">
                                    {selectedRequest.assignedAsset.name} - {selectedRequest.assignedAsset.assetTag}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {selectedRequest.assignedAsset.model}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => {
                        setOpenViewDialog(false);
                        setProcessForm({
                          ...processForm,
                          status: 'approved'
                        });
                        setOpenProcessDialog(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        setOpenViewDialog(false);
                        setProcessForm({
                          ...processForm,
                          status: 'rejected'
                        });
                        setOpenProcessDialog(true);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Layout>
  );
};

export default AdminDashboard;