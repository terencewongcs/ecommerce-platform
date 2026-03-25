import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import ProductTable from '../../components/ProductTable';
import { apiFetch } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import type { ApiProduct, Pagination as PaginationType } from '../../lib/apiTypes';

type ProductsResponse = { products: ApiProduct[]; pagination: PaginationType };

export default function ProductListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Admin sees all products; vendor sees only their own
  const endpoint = user?.role === 'admin' ? '/admin/products' : '/vendor/products';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', user?.role, page],
    queryFn: () => apiFetch<ProductsResponse>(`${endpoint}?page=${page}&limit=20`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${endpoint}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
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
    return <Alert severity="error">Failed to load products.</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/products/new')}
        >
          New Product
        </Button>
      </Box>

      <ProductTable
        products={data.products}
        onEdit={(id) => navigate(`/products/${id}`)}
        onDelete={(id) => setDeleteId(id)}
      />

      {data.pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={data.pagination.totalPages}
            page={page}
            onChange={(_e, p) => setPage(p)}
          />
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the product. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
