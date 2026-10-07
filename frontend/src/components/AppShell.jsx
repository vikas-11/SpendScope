import { useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import Brand from './Brand';
import ExpenseDialog from './ExpenseDialog';
import { useThemeMode } from '../context/ThemeModeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const links = [
  ['/', 'Overview'],
  ['/transactions', 'Transactions'],
  ['/budget', 'Budget'],
];

export default function AppShell() {
  const { mode, toggleMode } = useThemeMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchor, setAnchor] = useState(null);
  const [openExpense, setOpenExpense] = useState(false);

  const createExpense = async (payload) => {
    await api.post('/expenses', payload);
    window.dispatchEvent(new Event('expense:changed'));
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box className="app-grid-bg" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky', top: 0, zIndex: 20,
          bgcolor: mode === 'light' ? 'rgba(242,239,232,.86)' : 'rgba(12,14,16,.86)',
          backdropFilter: 'blur(18px)', borderBottom: '1px solid', borderColor: 'divider',
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 }, height: 76, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Brand compact />
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: .5, overflowX: 'auto' }} className="no-scrollbar">
            {links.map(([to, label]) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                color="inherit"
                sx={{
                  minWidth: 'auto', px: 1.6,
                  bgcolor: location.pathname === to ? 'action.selected' : 'transparent',
                  color: location.pathname === to ? 'text.primary' : 'text.secondary',
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
          <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
            <IconButton onClick={toggleMode}>{mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}</IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpenExpense(true)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Add expense</Button>
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ border: '1px solid', borderColor: 'divider' }}><PersonRoundedIcon /></IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem disabled>{user?.name || 'Account'}</MenuItem>
            <MenuItem onClick={signOut}>Sign out</MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box component="main" sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Outlet context={{ openExpense: () => setOpenExpense(true) }} />
      </Box>

      <IconButton
        onClick={() => setOpenExpense(true)}
        sx={{ display: { xs: 'flex', sm: 'none' }, position: 'fixed', right: 20, bottom: 20, bgcolor: 'primary.main', color: 'primary.contrastText', width: 58, height: 58, '&:hover': { bgcolor: 'primary.main' } }}
      >
        <AddRoundedIcon />
      </IconButton>

      <ExpenseDialog open={openExpense} onClose={() => setOpenExpense(false)} onSubmit={createExpense} />
    </Box>
  );
}
