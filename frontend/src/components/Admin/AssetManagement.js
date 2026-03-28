import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment,
  Visibility
} from '@mui/icons-material';
import Layout from '../Layout/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AssetManagement = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    assetTag: '',
    name: '',
    category: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    condition: 'good',
    location: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 
    'Printer', 'Phone', 'Tablet', 'Webcam','Other'
  ];

  const conditions = ['new', 'good', 'fair', 'poor'];

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      setAssets(response.data.assets);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users/employees');
      setEmployees(response.data.employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenDialog = (asset = null) => {
    if (asset) {
      setSelectedAsset(asset);
      setFormData({
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
        warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
        condition: asset.condition,
        location: asset.location || '',
        notes: asset.notes || ''
      });
    } else {
      setSelectedAsset(null);
      setFormData({
        assetTag: '',
        name: '',
        category: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        warrantyExpiry: '',
        condition: 'good',
        location: '',
        notes: ''
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAsset(null);
    setError('');
  };

  const handleOpenAssign = (asset) => {
    setSelectedAsset(asset);
    setOpenAssignDialog(true);
  };

  const handleCloseAssign = () => {
    setOpenAssignDialog(false);
    setSelectedAsset(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (selectedAsset) {
        // Update asset
        const response = await api.put(`/assets/${selectedAsset._id}`, formData);
        if (response.data.success) {
          setSuccess('Asset updated successfully');
          fetchAssets();
          handleCloseDialog();
        }
      } else {
        // Create asset
        const response = await api.post('/assets', formData);
        if (response.data.success) {
          setSuccess('Asset created successfully');
          fetchAssets();
          handleCloseDialog();
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving asset');
    }
  };

  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        const response = await api.delete(`/assets/${assetId}`);
        if (response.data.success) {
          setSuccess('Asset deleted successfully');
          fetchAssets();
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Error deleting asset');
      }
    }
  };

  const handleAssign = async (employeeId) => {
    try {
      const response = await api.put(`/assets/${selectedAsset._id}/assign`, {
        employeeId
      });
      if (response.data.success) {
        setSuccess('Asset assigned successfully');
        fetchAssets();
        handleCloseAssign();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error assigning asset');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'assigned': return 'primary';
      case 'maintenance': return 'warning';
      case 'retired': return 'error';
      default: return 'default';
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Asset Management</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add New Asset
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset Tag</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset._id}>
                  <TableCell>{asset.assetTag}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>{asset.model}</TableCell>
                  <TableCell>
                    <Chip
                      label={asset.status}
                      color={getStatusColor(asset.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={asset.condition}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {asset.assignedTo ? (
                      `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}`
                    ) : (
                      <Chip label="Unassigned" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(asset)}
                      title="Edit"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenAssign(asset)}
                      title="Assign"
                      disabled={asset.status !== 'available'}
                    >
                      <Assignment />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(asset._id)}
                      title="Delete"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Asset Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedAsset ? 'Edit Asset' : 'Add New Asset'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Asset Tag"
                  name="assetTag"
                  value={formData.assetTag}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Asset Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Category"
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    label="Condition"
                  >
                    {conditions.map((cond) => (
                      <MenuItem key={cond} value={cond}>
                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Date"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Warranty Expiry"
                  name="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedAsset ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Asset Dialog */}
        <Dialog open={openAssignDialog} onClose={handleCloseAssign}>
          <DialogTitle>Assign Asset</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" gutterBottom>
              Asset: {selectedAsset?.name} ({selectedAsset?.assetTag})
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Employee</InputLabel>
              <Select
                label="Select Employee"
                onChange={(e) => handleAssign(e.target.value)}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.employeeId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssign}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default AssetManagement;