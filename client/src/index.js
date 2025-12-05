import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#c9a227',
      light: '#e3c565',
      dark: '#8b6914',
    },
    secondary: {
      main: '#6b5b95',
      light: '#9a8bc7',
      dark: '#3d2f66',
    },
    background: {
      default: '#0d0d14',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#e8e6e3',
      secondary: '#a8a5a0',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    divider: 'rgba(201, 162, 39, 0.2)',
  },
  typography: {
    fontFamily: '"Crimson Pro", Georgia, serif',
    h1: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
    },
    h2: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
    },
    button: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
      textTransform: 'none',
    },
    body1: {
      fontSize: '1.05rem',
    },
    body2: {
      fontSize: '0.95rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(201, 162, 39, 0.15)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Cinzel", serif',
          fontWeight: 600,
          fontSize: '0.9rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.95rem',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(201, 162, 39, 0.1)',
        },
        head: {
          fontFamily: '"Cinzel", serif',
          fontWeight: 600,
          backgroundColor: 'rgba(201, 162, 39, 0.08)',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

