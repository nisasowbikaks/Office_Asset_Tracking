import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AccountCircle,
  Inventory,
  Assignment,
  Assessment,
  Security,
  Speed,
  Login as LoginIcon,
  PersonAdd as RegisterIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(15, 0),
  marginBottom: theme.spacing(8),
  borderRadius: '0 0 50% 50% / 20px',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
}));

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleDashboard = () => {
    handleClose();
    if (user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/employee');
    }
  };

  const features = [
    {
      icon: <Inventory sx={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Asset Management',
      description: 'Track and manage all office assets efficiently with real-time updates and history.'
    },
    {
      icon: <Assignment sx={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Request System',
      description: 'Employees can request assets easily. Admins can approve and assign with one click.'
    },
    {
      icon: <Assessment sx={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports on asset utilization, requests, and maintenance.'
    },
    {
      icon: <Security sx={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Role-Based Access',
      description: 'Secure access with different permissions for admins and employees.'
    },
    {
      icon: <Speed sx={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Real-Time Updates',
      description: 'Get instant notifications about asset assignments and request status.'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar position="static">
        <Toolbar>
          <Inventory sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Office Asset Tracking System
          </Typography>
          
          {user ? (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user.firstName} {user.lastName}
                  </Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography variant="caption" color="textSecondary">
                    Role: {user.role}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleDashboard}>Dashboard</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          ) : (
            <Box>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                startIcon={<LoginIcon />}
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={() => navigate('/register')}
                startIcon={<RegisterIcon />}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>

      <HeroSection>
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Office Asset Tracking System
          </Typography>
          <Typography variant="h5" align="center" paragraph>
            Streamline your office asset management with our comprehensive tracking system. 
            Track, manage, and request assets seamlessly.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!user && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </>
            )}
          </Box>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          component="h2"
          variant="h3"
          align="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Key Features
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <FeatureCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Paper sx={{ bgcolor: 'primary.main', color: 'white', py: 6, mb: 0 }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" gutterBottom>
            Ready to streamline your asset management?
          </Typography>
          <Typography variant="body1" align="center" paragraph>
            Join thousands of companies using our system to manage their office assets efficiently.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
};

export default HomePage;