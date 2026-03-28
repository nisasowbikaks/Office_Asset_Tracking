import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Chip,
  Paper,
  Avatar,
  IconButton,
  Button,
  Alert
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Build,
  Home,
  LocationOn,
  Warning,
  Close
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';

const getActionIcon = (action) => {
  switch(action) {
    case 'created':
      return <CheckCircle />;
    case 'assigned':
      return <Assignment />;
    case 'returned':
      return <Home />;
    case 'maintenance':
      return <Build />;
    case 'condition_updated':
      return <Warning />;
    case 'location_changed':
      return <LocationOn />;
    default:
      return <CheckCircle />;
  }
};

const getActionColor = (action) => {
  switch(action) {
    case 'created':
      return 'success';
    case 'assigned':
      return 'primary';
    case 'returned':
      return 'info';
    case 'maintenance':
      return 'warning';
    case 'condition_updated':
      return 'error';
    case 'location_changed':
      return 'secondary';
    default:
      return 'grey';
  }
};

const AssetHistory = ({ open, onClose, assetId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && assetId) {
      fetchHistory();
    }
  }, [open, assetId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assets/${assetId}/history`);
      setHistory(response.data.history);
    } catch (error) {
      setError('Failed to load asset history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Asset History</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {history.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No history available</Typography>
          </Box>
        )}
        
        <Timeline position="alternate">
          {history.map((entry, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="text.secondary">
                {format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={getActionColor(entry.action)}>
                  {getActionIcon(entry.action)}
                </TimelineDot>
                {index < history.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {entry.action.toUpperCase().replace('_', ' ')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {entry.previousStatus && entry.newStatus && (
                      <Typography variant="body2">
                        Status: {entry.previousStatus} → {entry.newStatus}
                      </Typography>
                    )}
                    {entry.previousCondition && entry.newCondition && (
                      <Typography variant="body2">
                        Condition: {entry.previousCondition} → {entry.newCondition}
                      </Typography>
                    )}
                    {entry.previousLocation && entry.newLocation && (
                      <Typography variant="body2">
                        Location: {entry.previousLocation} → {entry.newLocation}
                      </Typography>
                    )}
                    {entry.assignedTo && (
                      <Typography variant="body2">
                        Assigned To: {entry.assignedTo.firstName} {entry.assignedTo.lastName}
                      </Typography>
                    )}
                    {entry.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{entry.notes}"
                      </Typography>
                    )}
                  </Box>
                  {entry.performedBy && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {entry.performedBy.firstName?.[0]}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        by {entry.performedBy.firstName} {entry.performedBy.lastName}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </DialogContent>
    </Dialog>
  );
};

export default AssetHistory;