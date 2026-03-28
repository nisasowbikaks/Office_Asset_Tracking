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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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

const departments = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'IT',
  'Operations',
  'Administration',
  'Customer Support',
  'Research & Development'
];

const steps = ['Account Type', 'Personal Information', 'Account Details'];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Account Type
    role: 'employee',
    
    // Personal Information
    firstName: '',
    lastName: '',
    employeeId: '',
    department: '',
    phoneNumber: '',
    
    // Account Details
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateStep = () => {
    setError('');
    
    switch(activeStep) {
      case 0: // Account Type
        return true;
        
      case 1: // Personal Information
        if (!formData.firstName?.trim()) {
          setError('First name is required');
          return false;
        }
        if (!formData.lastName?.trim()) {
          setError('Last name is required');
          return false;
        }
        if (!formData.employeeId?.trim()) {
          setError('Employee ID is required');
          return false;
        }
        if (!formData.department) {
          setError('Department is required');
          return false;
        }
        if (!formData.phoneNumber?.trim()) {
          setError('Phone number is required');
          return false;
        }
        // Phone number validation (basic)
        if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
          setError('Please enter a valid 10-digit phone number');
          return false;
        }
        return true;
        
      case 2: // Account Details
        if (!formData.email?.trim()) {
          setError('Email is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!formData.password) {
          setError('Password is required');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (activeStep !== steps.length - 1) {
      handleNext();
      return;
    }

    // Final validation
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registrationData } = formData;
    
    console.log('Sending registration data:', registrationData);
    
    const result = await register(registrationData);
    
    if (result.success) {
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select your role in the organization
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={formData.role === 'employee' ? 8 : 1}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: formData.role === 'employee' ? '2px solid #1976d2' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => setFormData({ ...formData, role: 'employee' })}
                >
                  <BusinessCenterIcon 
                    color={formData.role === 'employee' ? 'primary' : 'action'}
                    sx={{ fontSize: 48, mb: 2 }}
                  />
                  <Typography variant="h6">Employee</Typography>
                  <Typography variant="body2" color="textSecondary">
                    View assigned assets, request new assets, report maintenance
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={formData.role === 'admin' ? 8 : 1}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: formData.role === 'admin' ? '2px solid #1976d2' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                >
                  <AdminPanelSettingsIcon 
                    color={formData.role === 'admin' ? 'primary' : 'action'}
                    sx={{ fontSize: 48, mb: 2 }}
                  />
                  <Typography variant="h6">Admin</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Manage assets, users, assignments, and generate reports
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="employeeId"
                label="ID"
                name="employeeId"
                autoComplete="off"
                value={formData.employeeId}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="phoneNumber"
                label="Phone Number"
                name="phoneNumber"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={loading}
                placeholder="1234567890"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  name="department"
                  label="Department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                helperText="Minimum 6 characters"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                helperText={
                  formData.password !== formData.confirmPassword && formData.confirmPassword !== '' 
                    ? 'Passwords do not match' 
                    : ''
                }
              />
            </Grid>
          </Grid>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <StyledPaper>
        <PersonAddIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Create Account
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Register for Office Asset Tracking System
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box sx={{ width: '100%', mt: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box sx={{ width: '100%' }}>
                    {getStepContent(index)}
                    
                    <Box sx={{ mt: 3, mb: 2 }}>
                      <div>
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={loading}
                        >
                          {index === steps.length - 1 ? 'Finish' : 'Continue'}
                        </Button>
                        <Button
                          disabled={index === 0 || loading}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                      </div>
                    </Box>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Already have an account? Sign In
            </Typography>
          </Link>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default Register;