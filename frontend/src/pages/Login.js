import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  FormControl,  // Add this
  FormLabel,     // Add this
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
}));

const RoleCard = styled(Box)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'center',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employee',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password, formData.role);
    
    if (result.success) {
      if (result.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    } else {
      setError(result.message || 'Invalid credentials or role selection');
    }
    
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="sm">
      <StyledPaper>
        <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Asset Tracking System
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Sign in to your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend">Select Role</FormLabel>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <RoleCard
                selected={formData.role === 'admin'}
                onClick={() => handleRoleSelect('admin')}
                sx={{ flex: 1 }}
              >
                <AdminPanelSettingsIcon 
                  color={formData.role === 'admin' ? 'primary' : 'action'}
                  sx={{ fontSize: 40 }}
                />
                <Typography variant="h6">Admin</Typography>
                <Typography variant="body2" color="textSecondary">
                  Manage assets and users
                </Typography>
              </RoleCard>

              <RoleCard
                selected={formData.role === 'employee'}
                onClick={() => handleRoleSelect('employee')}
                sx={{ flex: 1 }}
              >
                <BusinessCenterIcon 
                  color={formData.role === 'employee' ? 'primary' : 'action'}
                  sx={{ fontSize: 40 }}
                />
                <Typography variant="h6">Employee</Typography>
                <Typography variant="body2" color="textSecondary">
                  View and request assets
                </Typography>
              </RoleCard>
            </Box>
          </FormControl>

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Don't have an account? Sign Up
              </Typography>
            </Link>
          </Box>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default Login;