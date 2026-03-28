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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Computer,
  Phone,
  Print,
  Mouse,
  Keyboard,
  Devices,
  Visibility,
  Refresh,
  Inventory
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../Layout/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
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
    status === 'new' ? '#e8f5e8' :
    status === 'good' ? '#e3f2fd' :
    status === 'fair' ? '#fff3e0' :
    status === 'poor' ? '#ffebee' : '#ffebee',
  color: 
    status === 'available' ? '#2e7d32' :
    status === 'assigned' ? '#1565c0' :
    status === 'maintenance' ? '#ef6c00' :
    status === 'new' ? '#2e7d32' :
    status === 'good' ? '#1565c0' :
    status === 'fair' ? '#ef6c00' :
    status === 'poor' ? '#c62828' : '#c62828',
}));

const MyAssets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myAssets, setMyAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openAssetDialog, setOpenAssetDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from my-assets endpoint
      try {
        const response = await api.get('/assets/my-assets');
        setMyAssets(response.data.assets);
      } catch (error) {
        // Fallback: filter from all assets
        console.log('Using fallback for my assets');
        const allAssetsRes = await api.get('/assets');
        const assignedAssets = allAssetsRes.data.assets.filter(
          asset => asset.assignedTo && asset.assignedTo._id === user?.id
        );
        setMyAssets(assignedAssets);
      }
      
    } catch (error) {
      console.error('Error fetching assets:', error);
      setError('Failed to load your assets');
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

  if (loading) {
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
              My Assets
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View all assets assigned to you
            </Typography>
          </Box>
          <IconButton 
            onClick={fetchMyAssets}
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

        {/* Assets Grid */}
        {myAssets.length > 0 ? (
          <Grid container spacing={3}>
            {myAssets.map((asset) => (
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
                      {asset.warrantyExpiry && (
                        <Typography variant="body2" sx={{ color: '#555' }}>
                          <strong>Warranty:</strong> {new Date(asset.warrantyExpiry).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
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
                  </CardActions>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f9f9f9' }}>
            <Inventory sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No assets assigned to you yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Once admin assigns assets to you, they will appear here
            </Typography>
          </Paper>
        )}

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
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Layout>
  );
};

export default MyAssets;