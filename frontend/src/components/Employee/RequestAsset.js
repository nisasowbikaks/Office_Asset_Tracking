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
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  Computer,
  Phone,
  Print,
  Mouse,
  Keyboard,
  Devices,
  Assignment,
  Refresh,
  Send,
  Visibility,
  CheckCircle,
  Pending
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

const RequestAsset = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openAssetDialog, setOpenAssetDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestForm, setRequestForm] = useState({
    assetType: '',
    reason: '',
    priority: 'medium',
    additionalNotes: ''
  });

  // Asset categories for request form
  const assetCategories = [
    'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse',
    'Printer', 'Phone', 'Tablet', 'Headset', 'Webcam', 'Other'
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available assets
      const assetsRes = await api.get('/assets');
      setAssets(assetsRes.data.assets);
      
      // Fetch my recent requests
      const requestsRes = await api.get('/requests/my-requests');
      setMyRequests(requestsRes.data.requests.slice(0, 5)); // Show only 5 most recent
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChange = (e) => {
    setRequestForm({
      ...requestForm,
      [e.target.name]: e.target.value
    });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await api.post('/requests', requestForm);
      
      if (response.data.success) {
        setSuccess('Request submitted successfully!');
        setRequestForm({
          assetType: '',
          reason: '',
          priority: 'medium',
          additionalNotes: ''
        });
        fetchData(); // Refresh data
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
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

  if (loading && !assets.length) {
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
              Request Asset
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Submit a request for a new asset
            </Typography>
          </Box>
          <IconButton 
            onClick={fetchData}
            sx={{ 
              backgroundColor: '#f5f5f5',
              '&:hover': { backgroundColor: '#e0e0e0' }
            }}
          >
            <Refresh />
          </IconButton>
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

        <Grid container spacing={3}>
          {/* Request Form */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
                Request Form
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <form onSubmit={handleRequestSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Asset Type</InputLabel>
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
                      rows={4}
                      placeholder="Please explain why you need this asset and how it will be used"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Priority</InputLabel>
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
                      label="Additional Notes"
                      name="additionalNotes"
                      value={requestForm.additionalNotes}
                      onChange={handleRequestChange}
                      multiline
                      rows={2}
                      placeholder="Any specific requirements or additional information"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<Send />}
                      disabled={!requestForm.assetType || !requestForm.reason || loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Submit Request'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Available Assets Preview */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
                Available Assets ({assets.length})
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {assets.length > 0 ? (
                <Grid container spacing={2}>
                  {assets.slice(0, 4).map((asset) => (
                    <Grid item xs={12} sm={6} key={asset._id}>
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
                          
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ color: '#333' }}>
                            {asset.name}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {asset.category} • {asset.model || 'No model'}
                          </Typography>
                          
                          <Typography variant="body2" sx={{ color: '#555', mt: 1 }}>
                            <strong>Asset Tag:</strong> {asset.assetTag}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            startIcon={<Visibility />}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setOpenAssetDialog(true);
                            }}
                          >
                            Details
                          </Button>
                          <Button 
                            size="small" 
                            color="primary"
                            startIcon={<Assignment />}
                            onClick={() => {
                              setRequestForm({
                                ...requestForm,
                                assetType: asset.category
                              });
                              // Scroll to form
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            Request Similar
                          </Button>
                        </CardActions>
                      </StyledCard>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Devices sx={{ fontSize: 48, color: '#bdbdbd', mb: 2 }} />
                  <Typography color="text.secondary">
                    No assets available at the moment
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Recent Requests */}
            {myRequests.length > 0 && (
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
                  Recent Requests
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {myRequests.map((request) => (
                  <Box 
                    key={request._id}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid #f0f0f0',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ color: '#333' }}>
                        {request.assetType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(request.requestedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={request.priority}
                        size="small"
                        color={getPriorityColor(request.priority)}
                      />
                      <Chip
                        label={request.status}
                        size="small"
                        color={
                          request.status === 'approved' ? 'success' :
                          request.status === 'pending' ? 'warning' :
                          request.status === 'fulfilled' ? 'info' : 'default'
                        }
                      />
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Asset Details Dialog */}
        <Dialog
          open={openAssetDialog}
          onClose={() => setOpenAssetDialog(false)}
          maxWidth="sm"
          fullWidth
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
                    <Chip
                      label={selectedAsset.condition}
                      size="small"
                      color={
                        selectedAsset.condition === 'new' ? 'success' :
                        selectedAsset.condition === 'good' ? 'primary' :
                        selectedAsset.condition === 'fair' ? 'warning' : 'error'
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedAsset.status}
                      size="small"
                      color={selectedAsset.status === 'available' ? 'success' : 'default'}
                    />
                  </Grid>
                  {selectedAsset.location && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#555' }}>
                        {selectedAsset.location}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpenAssetDialog(false)}>Close</Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setOpenAssetDialog(false);
                    setRequestForm({
                      ...requestForm,
                      assetType: selectedAsset.category
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Request Similar
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Layout>
  );
};

export default RequestAsset;