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
import type { AdminStats } from '../../lib/apiTypes';

export default function OverviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiFetch<AdminStats>('/admin/stats'),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Failed to load dashboard stats.</Alert>;
  }

  const publishedRatio = data.products.total > 0
    ? `${data.products.published} published`
    : 'No products yet';

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Overview
      </Typography>

      {/* Stats cards */}
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

      {/* Revenue chart */}
      <SalesChart data={data.dailyRevenue} />
    </Box>
  );
}
