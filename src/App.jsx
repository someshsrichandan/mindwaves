import { useState } from 'react';
import Dashboard from './components/Dashboard';
import './App.css';
import { Box } from '@mui/material';

function App() {
  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Dashboard />
    </Box>
  );
}

export default App;