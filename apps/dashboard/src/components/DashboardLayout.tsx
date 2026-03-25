import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Overview', path: '/', icon: <DashboardIcon /> },
  { label: 'Products', path: '/products', icon: <InventoryIcon /> },
  { label: 'Orders', path: '/orders', icon: <ShoppingCartIcon /> },
] as const;

const ADMIN_NAV_ITEMS = [
  { label: 'Users', path: '/users', icon: <PeopleIcon /> },
] as const;

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top app bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'primary.main' }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
            TrendyUnique Admin
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
              {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'}
            </Avatar>
            <Typography variant="body2" sx={{ color: 'grey.300' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Tooltip title="Logout">
              <IconButton color="inherit" onClick={handleLogout} size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Permanent sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#0f0f23',
            color: 'grey.300',
          },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar height */}
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'rgba(197, 151, 62, 0.15)',
                      borderRight: '3px solid',
                      borderColor: 'secondary.main',
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? 'secondary.main' : 'grey.500', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 14, color: isActive(item.path) ? 'grey.100' : 'grey.400' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* Admin-only section */}
          {user?.role === 'admin' && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1 }} />
              <List>
                {ADMIN_NAV_ITEMS.map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      selected={isActive(item.path)}
                      onClick={() => navigate(item.path)}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'rgba(197, 151, 62, 0.15)',
                          borderRight: '3px solid',
                          borderColor: 'secondary.main',
                        },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive(item.path) ? 'secondary.main' : 'grey.500', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 14, color: isActive(item.path) ? 'grey.100' : 'grey.400' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Drawer>

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Spacer for AppBar height */}
        <Outlet />
      </Box>
    </Box>
  );
}
