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
  InputAdornment,
  Switch,
  FormControlLabel,
  Rating,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  People,
  PersonAdd,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Visibility,
  Refresh,
  Search,
  Clear,
  FilterList,
  Email,
  Phone,
  Business,
  Assignment,
  Inventory,
  Timeline,
  Download,
  Print,
  AdminPanelSettings,
  Work,
  Verified,
  Warning,
  Info
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

// Styled components
const StatusChip = styled(Chip)(({ status }) => ({
  fontWeight: 600,
  backgroundColor: status === 'active' ? '#e8f5e8' : '#ffebee',
  color: status === 'active' ? '#2e7d32' : '#c62828',
}));

const RoleChip = styled(Chip)(({ role }) => ({
  fontWeight: 600,
  backgroundColor: role === 'admin' ? '#e3f2fd' : '#f3e5f5',
  color: role === 'admin' ? '#1565c0' : '#9c27b0',
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

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    status: '',
    joinDateFrom: '',
    joinDateTo: ''
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    role: 'employee',
    isActive: true
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    employees: 0,
    departments: {}
  });

  const departments = [
    'Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance',
    'IT', 'Operations', 'Administration', 'Customer Support', 'Research & Development'
  ];

  const roles = ['admin', 'employee'];

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
      calculateStats(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (usersData) => {
    const active = usersData.filter(u => u.isActive).length;
    const inactive = usersData.filter(u => !u.isActive).length;
    const admins = usersData.filter(u => u.role === 'admin').length;
    const employees = usersData.filter(u => u.role === 'employee').length;
    
    // Count users by department
    const deptCount = {};
    usersData.forEach(user => {
      if (user.department) {
        deptCount[user.department] = (deptCount[user.department] || 0) + 1;
      }
    });
    
    setStats({
      total: usersData.length,
      active,
      inactive,
      admins,
      employees,
      departments: deptCount
    });
  };

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...users];
    
    // Filter by tab status
    if (tabValue === 1) {
      filtered = filtered.filter(u => u.isActive === true);
    } else if (tabValue === 2) {
      filtered = filtered.filter(u => u.isActive === false);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.employeeId?.toLowerCase().includes(term) ||
        u.department?.toLowerCase().includes(term)
      );
    }
    
    // Apply advanced filters
    if (filters.role) {
      filtered = filtered.filter(u => u.role === filters.role);
    }
    if (filters.department) {
      filtered = filtered.filter(u => u.department === filters.department);
    }
    if (filters.status) {
      filtered = filtered.filter(u => u.isActive === (filters.status === 'active'));
    }
    if (filters.joinDateFrom) {
      filtered = filtered.filter(u => new Date(u.createdAt) >= new Date(filters.joinDateFrom));
    }
    if (filters.joinDateTo) {
      filtered = filtered.filter(u => new Date(u.createdAt) <= new Date(filters.joinDateTo));
    }
    
    setFilteredUsers(filtered);
  }, [users, tabValue, searchTerm, filters]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Toggle user status (activate/deactivate)
  const handleToggleStatus = async (userId, currentStatus) => {
    if (userId === currentUser?.id) {
      setError('You cannot deactivate your own account');
      return;
    }
    
    const action = currentStatus ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const response = await api.put(`/users/${userId}/toggle-status`);
        if (response.data.success) {
          setSuccess(`User ${action}d successfully`);
          fetchUsers();
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to update user status');
      }
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/users/${selectedUser._id}`, editForm);
      if (response.data.success) {
        setSuccess('User updated successfully');
        setOpenEditDialog(false);
        fetchUsers();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      setError('You cannot delete your own account');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await api.delete(`/users/${userId}`);
        if (response.data.success) {
          setSuccess('User deleted successfully');
          fetchUsers();
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      role: '',
      department: '',
      status: '',
      joinDateFrom: '',
      joinDateTo: ''
    });
    setSearchTerm('');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Role', 'Status', 'Joined Date'];
    const data = filteredUsers.map(u => [
      u.employeeId,
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.department,
      u.role,
      u.isActive ? 'Active' : 'Inactive',
      format(new Date(u.createdAt), 'dd MMM yyyy')
    ]);
    
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !users.length) {
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
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all users in the system
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToCSV}
              disabled={filteredUsers.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => navigate('/register')}
            >
              Add New User
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchUsers}
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
                <Typography color="inherit" gutterBottom variant="body2">Total Users</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{stats.total}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip size="small" label={`${stats.admins} Admins`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip size="small" label={`${stats.employees} Employees`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard bgcolor="linear-gradient(135deg, #4caf50 0%, #388e3c 100%)" onClick={() => setTabValue(1)}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">Active Users</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{stats.active}</Typography>
                <Button size="small" sx={{ mt: 2, color: 'white', borderColor: 'white' }} variant="outlined">
                  {Math.round((stats.active / stats.total) * 100)}% Active
                </Button>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard bgcolor="linear-gradient(135deg, #f44336 0%, #d32f2f 100%)" onClick={() => setTabValue(2)}>
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">Inactive Users</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{stats.inactive}</Typography>
                <Button size="small" sx={{ mt: 2, color: 'white', borderColor: 'white' }} variant="outlined">
                  View Inactive
                </Button>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard bgcolor="linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)">
              <CardContent>
                <Typography color="inherit" gutterBottom variant="body2">Departments</Typography>
                <Typography variant="h3" component="div" fontWeight="bold">{Object.keys(stats.departments).length}</Typography>
                <Button size="small" sx={{ mt: 2, color: 'white', borderColor: 'white' }} variant="outlined">
                  View All
                </Button>
              </CardContent>
            </StatCard>
          </Grid>
        </Grid>

        {/* Department Summary */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" color="text.secondary">Departments:</Typography>
            {Object.entries(stats.departments).slice(0, 5).map(([dept, count]) => (
              <Chip
                key={dept}
                label={`${dept}: ${count}`}
                size="small"
                sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}
                onClick={() => setFilters({ ...filters, department: dept })}
              />
            ))}
            {Object.keys(stats.departments).length > 5 && (
              <Typography variant="caption" color="text.secondary">
                +{Object.keys(stats.departments).length - 5} more
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, email, employee ID..."
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
                {(filters.role || filters.department || filters.status || filters.joinDateFrom || filters.joinDateTo) && (
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
                {filteredUsers.length} user(s) found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="All Users" icon={<People />} iconPosition="start" />
            <Tab 
              label={<Badge badgeContent={stats.active} color="success">Active</Badge>}
              icon={<CheckCircle />} 
              iconPosition="start"
            />
            <Tab 
              label={<Badge badgeContent={stats.inactive} color="error">Inactive</Badge>}
              icon={<Block />} 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Users Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Employee ID</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Joined Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#1976d2' }}>
                        {user.employeeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: user.role === 'admin' ? '#1976d2' : '#9c27b0' }}>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id.slice(-6)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14 }} /> {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 12 }} /> {user.phoneNumber || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Business sx={{ fontSize: 16 }} />}
                        label={user.department}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <RoleChip
                        label={user.role}
                        size="small"
                        role={user.role}
                        icon={user.role === 'admin' ? <AdminPanelSettings /> : <Work />}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        status={user.isActive ? 'active' : 'inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={format(new Date(user.createdAt), 'dd MMM yyyy, hh:mm a')}>
                        <Typography variant="body2">
                          {format(new Date(user.createdAt), 'dd MMM yyyy')}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setOpenViewDialog(true);
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditForm({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phoneNumber: user.phoneNumber || '',
                                department: user.department,
                                role: user.role,
                                isActive: user.isActive
                              });
                              setOpenEditDialog(true);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive ? 'Deactivate User' : 'Activate User'}>
                          <IconButton
                            size="small"
                            color={user.isActive ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                            disabled={user._id === currentUser?.id}
                          >
                            {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        {user._id !== currentUser?.id && (
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <Delete fontSize="small" />
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
                    <People sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No users found
                    </Typography>
                    {(searchTerm || filters.role || filters.department || filters.status) && (
                      <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
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
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    label="Role"
                  >
                    <MenuItem value="">All</MenuItem>
                    {roles.map(role => (
                      <MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    label="Department"
                  >
                    <MenuItem value="">All</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Joined From"
                  type="date"
                  value={filters.joinDateFrom}
                  onChange={(e) => setFilters({ ...filters, joinDateFrom: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Joined To"
                  type="date"
                  value={filters.joinDateTo}
                  onChange={(e) => setFilters({ ...filters, joinDateTo: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={clearFilters}>Clear All</Button>
            <Button onClick={() => setOpenFilterDialog(false)} variant="contained">Apply Filters</Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Edit />
              <Typography variant="h6">Edit User</Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    label="Department"
                  >
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    label="Role"
                  >
                    <MenuItem value="employee">Employee</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                  }
                  label="Active Account"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View User Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedUser && (
            <>
              <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People />
                  <Typography variant="h6">User Details</Typography>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 100,
                          height: 100,
                          bgcolor: selectedUser.role === 'admin' ? '#1976d2' : '#9c27b0',
                          fontSize: 40,
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                      </Avatar>
                      <Typography variant="h5" gutterBottom>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {selectedUser.employeeId}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <RoleChip label={selectedUser.role} role={selectedUser.role} />
                        <StatusChip
                          label={selectedUser.isActive ? 'Active' : 'Inactive'}
                          status={selectedUser.isActive ? 'active' : 'inactive'}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Contact Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedUser.email}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                        <Typography variant="body1">{selectedUser.phoneNumber || 'Not provided'}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Department</Typography>
                        <Chip icon={<Business />} label={selectedUser.department} size="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Joined Date</Typography>
                        <Typography variant="body1">
                          {format(new Date(selectedUser.createdAt), 'dd MMMM yyyy, hh:mm a')}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => {
                    setOpenViewDialog(false);
                    setEditForm({
                      firstName: selectedUser.firstName,
                      lastName: selectedUser.lastName,
                      email: selectedUser.email,
                      phoneNumber: selectedUser.phoneNumber || '',
                      department: selectedUser.department,
                      role: selectedUser.role,
                      isActive: selectedUser.isActive
                    });
                    setOpenEditDialog(true);
                  }}
                >
                  Edit User
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Layout>
  );
};

export default UserManagement;