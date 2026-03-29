import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StatsCard from '../../components/StatsCard';
import SalesChart from '../../components/SalesChart';
import { apiFetch } from '../../lib/apiClient';
import type { AdminStats, VendorStats } from '../../lib/apiTypes';
import { useAuth } from '../../hooks/useAuth';

export default function OverviewPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiFetch<AdminStats>('/admin/stats'),
    enabled: isAdmin,
  });

  const vendorQuery = useQuery({
    queryKey: ['vendor', 'stats'],
    queryFn: () => apiFetch<VendorStats>('/vendor/stats'),
    enabled: !isAdmin,
  });

  const isLoading = isAdmin ? adminQuery.isLoading : vendorQuery.isLoading;
  const isError = isAdmin ? adminQuery.isError : vendorQuery.isError;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load dashboard stats.</Alert>;
  }

  // ── Admin view ───────────────────────────────────────────────────────────────

  if (isAdmin && adminQuery.data) {
    const data = adminQuery.data;
    const publishedRatio = data.products.total > 0
      ? `${data.products.published} published`
      : 'No products yet';

    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Overview
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="Total Products"
              value={data.products.total}
              subtitle={publishedRatio}
              icon={<InventoryIcon />}
              color="#c5973e"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="Total Orders"
              value={data.orders.total}
              icon={<ShoppingCartIcon />}
              color="#1a1a2e"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="Total Users"
              value={data.users.total}
              icon={<PeopleIcon />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard
              title="Total Revenue"
              value={`$${data.revenue.total.toFixed(2)}`}
              icon={<AttachMoneyIcon />}
              color="#7b1fa2"
            />
          </Grid>
        </Grid>

        <SalesChart data={data.dailyRevenue} />
      </Box>
    );
  }

  // ── Vendor view ──────────────────────────────────────────────────────────────

  if (!isAdmin && vendorQuery.data) {
    const data = vendorQuery.data;
    const publishedRatio = data.products.total > 0
      ? `${data.products.published} published`
      : 'No products yet';

    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Overview
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={4}>
            <StatsCard
              title="My Products"
              value={data.products.total}
              subtitle={publishedRatio}
              icon={<InventoryIcon />}
              color="#c5973e"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <StatsCard
              title="My Orders"
              value={data.orders.total}
              icon={<ShoppingCartIcon />}
              color="#1a1a2e"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4}>
            <StatsCard
              title="My Revenue"
              value={`$${data.revenue.total.toFixed(2)}`}
              icon={<AttachMoneyIcon />}
              color="#7b1fa2"
            />
          </Grid>
        </Grid>

        <SalesChart data={data.dailyRevenue} />
      </Box>
    );
  }

  return null;
}
