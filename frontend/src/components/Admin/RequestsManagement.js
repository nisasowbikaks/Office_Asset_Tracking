import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Container,
  Paper,
  Box,
  Grid,
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
  Badge,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Cancel,
  Pending,
  Visibility,
  Refresh,
  Done,
  Close,
  Computer,
  Phone,
  Print,
  Inventory,
  FilterList,
  Search,
  Clear,
  HourglassEmpty,
  Info,
  Download
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Navbar';
import api from '../../services/api';
import { format } from 'date-fns';

// Styled components
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

const StatCard = styled(Card)(({ theme, bgcolor }) => ({
  height: '100%',
  background: bgcolor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%'
  }
}));

const RequestsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    assetType: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
    employeeId: ''
  });
  const [processForm, setProcessForm] = useState({
    status: 'approved',
    adminRemarks: '',
    assignedAsset: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    fulfilled: 0,
    rejected: 0,
    cancelled: 0,
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    }
  });

  // Asset categories
  const assetCategories = [
    'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse',
    'Printer', 'Phone', 'Tablet', 'Headset', 'Webcam', 'Other'
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'];

  // Define applyFilters as useCallback to avoid dependency issues
  const applyFilters = useCallback(() => {
    let filtered = [...requests];
    
    // Filter by tab status
    if (tabValue === 1) {
      filtered = filtered.filter(r => r.status === 'pending');
    } else if (tabValue === 2) {
      filtered = filtered.filter(r => r.status === 'approved' || r.status === 'fulfilled');
    } else if (tabValue === 3) {
      filtered = filtered.filter(r => r.status === 'rejected' || r.status === 'cancelled');
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.requestId?.toLowerCase().includes(term) ||
        r.employee?.firstName?.toLowerCase().includes(term) ||
        r.employee?.lastName?.toLowerCase().includes(term) ||
        r.assetType?.toLowerCase().includes(term) ||
        r.reason?.toLowerCase().includes(term)
      );
    }
    
    // Apply advanced filters
    if (filters.assetType) {
      filtered = filtered.filter(r => r.assetType === filters.assetType);
    }
    if (filters.priority) {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(r => new Date(r.requestedDate) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => new Date(r.requestedDate) <= new Date(filters.dateTo));
    }
    if (filters.employeeId) {
      filtered = filtered.filter(r => 
        r.employee?.employeeId?.toLowerCase().includes(filters.employeeId.toLowerCase())
      );
    }
    
    setFilteredRequests(filtered);
  }, [requests, tabValue, searchTerm, filters]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all requests
      const requestsRes = await api.get('/requests');
      setRequests(requestsRes.data.requests);
      
      // Fetch all assets
      const assetsRes = await api.get('/assets');
      setAssets(assetsRes.data.assets);
      
      // Calculate stats
      const requestsData = requestsRes.data.requests;
      const pending = requestsData.filter(r => r.status === 'pending').length;
      const approved = requestsData.filter(r => r.status === 'approved').length;
      const fulfilled = requestsData.filter(r => r.status === 'fulfilled').length;
      const rejected = requestsData.filter(r => r.status === 'rejected').length;
      const cancelled = requestsData.filter(r => r.status === 'cancelled').length;
      
      const low = requestsData.filter(r => r.priority === 'low').length;
      const medium = requestsData.filter(r => r.priority === 'medium').length;
      const high = requestsData.filter(r => r.priority === 'high').length;
      const urgent = requestsData.filter(r => r.priority === 'urgent').length;
      
      setStats({
        total: requestsData.length,
        pending,
        approved,
        fulfilled,
        rejected,
        cancelled,
        byPriority: { low, medium, high, urgent }
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load requests');
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
        setSuccess(`Request ${processForm.status === 'approved' ? 'approved' : 'rejected'} successfully!`);
        setOpenProcessDialog(false);
        setProcessForm({
          status: 'approved',
          adminRemarks: '',
          assignedAsset: ''
        });
        fetchData();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableAssetsForRequest = () => {
    if (!selectedRequest) return [];
    
    const requestType = selectedRequest.assetType.trim().toLowerCase();
    
    return assets.filter(asset => {
      const assetCategory = asset.category.trim().toLowerCase();
      return asset.status === 'available' && assetCategory === requestType;
    });
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

  const clearFilters = () => {
    setFilters({
      assetType: '',
      priority: '',
      dateFrom: '',
      dateTo: '',
      employeeId: ''
    });
    setSearchTerm('');
  };

  const exportToCSV = () => {
    const headers = ['Request ID', 'Employee', 'Asset Type', 'Reason', 'Priority', 'Status', 'Requested Date', 'Admin Remarks'];
    const data = filteredRequests.map(r => [
      r.requestId,
      `${r.employee?.firstName} ${r.employee?.lastName}`,
      r.assetType,
      r.reason,
      r.priority,
      r.status,
      format(new Date(r.requestedDate), 'dd MMM yyyy'),
      r.adminRemarks || ''
    ]);
    
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const availableAssetsForRequest = getAvailableAssetsForRequest();

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
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#1976d2' }}>
              Requests Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and process all asset requests from employees
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToCSV}
              disabled={filteredRequests.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          </Box>
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
            <StatCard bgcolor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" onClick={() => setTabValue(0)}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">Total Requests</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{stats.total}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 2, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`${stats.pending} Pending`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip size="small" label={`${stats.approved + stats.fulfilled} Completed`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard bgcolor="linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)" onClick={() => setTabValue(1)}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">Pending</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{stats.pending}</Typography>
                <Button size="small" sx={{ mt: 2, color: 'white', borderColor: 'white' }} variant="outlined">
                  Need Action
                </Button>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard bgcolor="linear-gradient(135deg, #4caf50 0%, #388e3c 100%)" onClick={() => setTabValue(2)}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">Approved/Fulfilled</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{stats.approved + stats.fulfilled}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip size="small" label={`${stats.approved} Approved`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip size="small" label={`${stats.fulfilled} Fulfilled`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard bgcolor="linear-gradient(135deg, #f44336 0%, #d32f2f 100%)" onClick={() => setTabValue(3)}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">Rejected/Cancelled</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{stats.rejected + stats.cancelled}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip size="small" label={`${stats.rejected} Rejected`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip size="small" label={`${stats.cancelled} Cancelled`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
        </Grid>

        {/* Priority Summary */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" color="text.secondary">Priority Breakdown:</Typography>
            <Chip icon={<HourglassEmpty />} label={`Low: ${stats.byPriority.low}`} size="small" sx={{ bgcolor: '#e8f5e8', color: '#2e7d32' }} />
            <Chip icon={<Pending />} label={`Medium: ${stats.byPriority.medium}`} size="small" sx={{ bgcolor: '#fff3e0', color: '#ed6c02' }} />
            <Chip icon={<Cancel />} label={`High: ${stats.byPriority.high}`} size="small" sx={{ bgcolor: '#ffebee', color: '#c62828' }} />
            <Chip icon={<PriorityChip />} label={`Urgent: ${stats.byPriority.urgent}`} size="small" sx={{ bgcolor: '#fce4ec', color: '#c2185b' }} />
          </Box>
        </Paper>

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by Request ID, Employee, Asset Type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setOpenFilterDialog(true)}
                >
                  Filters
                </Button>
                {(filters.assetType || filters.priority || filters.dateFrom || filters.dateTo || filters.employeeId) && (
                  <Button
                    variant="text"
                    startIcon={<Clear />}
                    onClick={clearFilters}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" align="right">
                {filteredRequests.length} request(s) found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Requests Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="All Requests" icon={<Assignment />} iconPosition="start" />
            <Tab 
              label={<Badge badgeContent={stats.pending} color="error">Pending</Badge>}
              icon={<Pending />} 
              iconPosition="start"
            />
            <Tab label="Approved/Fulfilled" icon={<CheckCircle />} iconPosition="start" />
            <Tab label="Rejected/Cancelled" icon={<Cancel />} iconPosition="start" />
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
                      <Tooltip title={request.reason}>
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
                      </Tooltip>
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
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedRequest(request);
                              setOpenViewDialog(true);
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="Approve Request">
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
                              >
                                <Done fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Request">
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
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {request.assignedAsset && (
                          <Tooltip title="View Assigned Asset">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate('/admin/assets')}
                            >
                              <Inventory fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {request.adminRemarks && (
                          <Tooltip title={request.adminRemarks}>
                            <IconButton size="small">
                              <Info fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
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
                    {(searchTerm || filters.assetType || filters.priority || filters.dateFrom || filters.dateTo || filters.employeeId) && (
                      <Button
                        variant="outlined"
                        onClick={clearFilters}
                        sx={{ mt: 2 }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Filter Dialog */}
        <Dialog
          open={openFilterDialog}
          onClose={() => setOpenFilterDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList />
              <Typography variant="h6">Advanced Filters</Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Asset Type</InputLabel>
                  <Select
                    value={filters.assetType}
                    onChange={(e) => setFilters({ ...filters, assetType: e.target.value })}
                    label="Asset Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    {assetCategories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="">All</MenuItem>
                    {priorities.map(p => (
                      <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date From"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date To"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  placeholder="Search by employee ID"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={clearFilters}>Clear All</Button>
            <Button onClick={() => setOpenFilterDialog(false)} variant="contained">Apply Filters</Button>
          </DialogActions>
        </Dialog>

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
                  <Typography variant="subtitle2" color="text.secondary">Request Details</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body2"><strong>Request ID:</strong> {selectedRequest.requestId}</Typography>
                    <Typography variant="body2"><strong>Employee:</strong> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</Typography>
                    <Typography variant="body2"><strong>Asset Type:</strong> {selectedRequest.assetType}</Typography>
                    <Typography variant="body2"><strong>Reason:</strong> {selectedRequest.reason}</Typography>
                    <Typography variant="body2"><strong>Priority:</strong> {selectedRequest.priority}</Typography>
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
                        {availableAssetsForRequest.length > 0 ? (
                          availableAssetsForRequest.map(asset => (
                            <MenuItem key={asset._id} value={asset._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getAssetIcon(asset.category)}
                                <Box>
                                  <Typography variant="body2">{asset.name} - {asset.assetTag}</Typography>
                                  <Typography variant="caption" color="text.secondary">{asset.model} • {asset.condition}</Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled value="">
                            <Typography color="text.secondary">No available assets of type {selectedRequest.assetType}</Typography>
                          </MenuItem>
                        )}
                      </Select>
                      
                      {availableAssetsForRequest.length === 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }} action={
                          <Button color="inherit" size="small" onClick={() => {
                            setOpenProcessDialog(false);
                            navigate('/admin/assets');
                          }}>Add Asset</Button>
                        }>
                          No available assets of type <strong>{selectedRequest.assetType}</strong>
                        </Alert>
                      )}
                      
                      {availableAssetsForRequest.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          {availableAssetsForRequest.length} available asset(s)
                        </Typography>
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
            {processForm.status === 'approved' && availableAssetsForRequest.length === 0 ? (
              <Button variant="contained" onClick={() => {
                setOpenProcessDialog(false);
                navigate('/admin/assets');
              }}>Add Assets</Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleProcessRequest}
                disabled={loading || (processForm.status === 'approved' && !processForm.assignedAsset)}
                color={processForm.status === 'approved' ? 'success' : 'error'}
              >
                {loading ? <CircularProgress size={24} /> : processForm.status === 'approved' ? 'Approve & Assign' : 'Reject Request'}
              </Button>
            )}
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
                    <Typography variant="subtitle2" color="text.secondary">Employee Information</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#1976d2' }}>
                          {selectedRequest.employee?.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</Typography>
                          <Typography variant="body2" color="text.secondary">{selectedRequest.employee?.employeeId} • {selectedRequest.employee?.department}</Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2"><strong>Email:</strong> {selectedRequest.employee?.email}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedRequest.employee?.phoneNumber}</Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Request Information</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}><Typography variant="body2" color="text.secondary">Asset Type</Typography><Typography variant="body1" fontWeight="bold">{selectedRequest.assetType}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="body2" color="text.secondary">Priority</Typography><PriorityChip label={selectedRequest.priority} size="small" priority={selectedRequest.priority} /></Grid>
                        <Grid item xs={6}><Typography variant="body2" color="text.secondary">Status</Typography><StatusChip label={selectedRequest.status} size="small" status={selectedRequest.status} /></Grid>
                        <Grid item xs={6}><Typography variant="body2" color="text.secondary">Requested Date</Typography><Typography variant="body2">{format(new Date(selectedRequest.requestedDate), 'dd MMM yyyy, hh:mm a')}</Typography></Grid>
                        <Grid item xs={12}><Typography variant="body2" color="text.secondary">Reason</Typography><Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f9f9f9' }}><Typography variant="body2">{selectedRequest.reason}</Typography></Paper></Grid>
                        {selectedRequest.comments && <Grid item xs={12}><Typography variant="body2" color="text.secondary">Additional Comments</Typography><Typography variant="body2">{selectedRequest.comments}</Typography></Grid>}
                      </Grid>
                    </Paper>
                  </Grid>

                  {selectedRequest.processedBy && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Processing Information</Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}><Typography variant="body2" color="text.secondary">Processed By</Typography><Typography variant="body2">{selectedRequest.processedBy?.firstName} {selectedRequest.processedBy?.lastName}</Typography></Grid>
                          <Grid item xs={6}><Typography variant="body2" color="text.secondary">Processed Date</Typography><Typography variant="body2">{selectedRequest.processedDate && format(new Date(selectedRequest.processedDate), 'dd MMM yyyy, hh:mm a')}</Typography></Grid>
                          {selectedRequest.adminRemarks && <Grid item xs={12}><Typography variant="body2" color="text.secondary">Admin Remarks</Typography><Typography variant="body2">{selectedRequest.adminRemarks}</Typography></Grid>}
                          {selectedRequest.assignedAsset && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Assigned Asset</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                {getAssetIcon(selectedRequest.assignedAsset.category)}
                                <Box><Typography variant="body2">{selectedRequest.assignedAsset.name} - {selectedRequest.assignedAsset.assetTag}</Typography><Typography variant="caption" color="text.secondary">{selectedRequest.assignedAsset.model}</Typography></Box>
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
                    <Button variant="contained" color="success" onClick={() => {
                      setOpenViewDialog(false);
                      setProcessForm({ ...processForm, status: 'approved' });
                      setOpenProcessDialog(true);
                    }}>Approve</Button>
                    <Button variant="contained" color="error" onClick={() => {
                      setOpenViewDialog(false);
                      setProcessForm({ ...processForm, status: 'rejected' });
                      setOpenProcessDialog(true);
                    }}>Reject</Button>
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

export default RequestsManagement;