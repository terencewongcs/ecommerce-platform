import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import type { ApiOrder, OrderStatus } from '../../lib/apiTypes';

const STATUS_COLOR: Record<OrderStatus, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  pending_payment:  'warning',
  paid:             'info',
  processing:       'info',
  shipped:          'primary',
  delivered:        'success',
  completed:        'success',
  cancelled:        'error',
  refund_requested: 'warning',
  refunded:         'default',
};

// Vendors can move orders forward and approve refunds; cancellation/payment states are system-managed
const VENDOR_STATUS_OPTIONS: OrderStatus[] = ['processing', 'shipped', 'delivered', 'refunded'];
const ADMIN_STATUS_OPTIONS: OrderStatus[] = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refund_requested', 'refunded'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

  const endpoint = user?.role === 'admin' ? '/admin/orders' : '/vendor/orders';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiFetch<{ order: ApiOrder }>(`${endpoint}/${id!}`),
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) =>
      apiFetch(`${endpoint}/${id!}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', id] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSuccessMessage('Status updated!');
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Failed to load order.</Alert>;
  }

  const order = data.order;
  const statusOptions = user?.role === 'admin' ? ADMIN_STATUS_OPTIONS : VENDOR_STATUS_OPTIONS;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/orders')}>
          Orders
        </Link>
        <Typography color="text.primary">#{order._id.slice(-8).toUpperCase()}</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Order #{order._id.slice(-8).toUpperCase()}
        </Typography>
        <Chip
          label={order.status}
          color={STATUS_COLOR[order.status]}
          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Shipping address */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Shipping Address
              </Typography>
              <Typography variant="body2">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </Typography>
              <Typography variant="body2">{order.shippingAddress.address}</Typography>
              <Typography variant="body2">
                {order.shippingAddress.city}, {order.shippingAddress.zip}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Order summary */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Summary
              </Typography>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">${order.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Tax</Typography>
                <Typography variant="body2">${order.tax.toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Shipping</Typography>
                <Typography variant="body2">${order.shippingCost.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>Total</Typography>
                <Typography variant="body2" fontWeight={600}>${order.total.toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status update */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Update Status
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={order.status}
                  onChange={(e) => statusMutation.mutate(e.target.value as OrderStatus)}
                  disabled={statusMutation.isPending}
                >
                  {statusOptions.map((s) => (
                    <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Order items */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>${(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
}
