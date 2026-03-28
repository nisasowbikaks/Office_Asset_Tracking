import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './components/Admin/AdminDashboard';
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import AssetManagement from './components/Admin/AssetManagement';
import UserManagement from './components/Admin/UserManagement';
import RequestsManagement from './components/Admin/RequestsManagement';
import MyAssets from './components/Employee/MyAssets';
import RequestAsset from './components/Employee/RequestAsset';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/assets" element={
              <PrivateRoute role="admin">
                <AssetManagement />
              </PrivateRoute>
            } />
            <Route path="/admin/users" element={
              <PrivateRoute role="admin">
                <UserManagement />
              </PrivateRoute>
            } />
            <Route path="/admin/requests" element={
              <PrivateRoute role="admin">
                <RequestsManagement />
              </PrivateRoute>
            } />
            
            {/* Employee Routes */}
            <Route path="/employee" element={
              <PrivateRoute role="employee">
                <EmployeeDashboard />
              </PrivateRoute>
            } />
            <Route path="/employee/my-assets" element={
              <PrivateRoute role="employee">
                <MyAssets />
              </PrivateRoute>
            } />
            <Route path="/employee/request-asset" element={
              <PrivateRoute role="employee">
                <RequestAsset />
              </PrivateRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;