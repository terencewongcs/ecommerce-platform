import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';
import ProductForm, { type ProductFormValues } from '../../components/ProductForm';
import { apiFetch } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import type { ApiProduct } from '../../lib/apiTypes';

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

  const isEditing = !!id;
  const endpoint = user?.role === 'admin' ? '/admin/products' : '/vendor/products';

  // Load existing product when editing
  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiFetch<{ product: ApiProduct }>(`${endpoint}/${id!}`),
    enabled: isEditing,
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      // Transform form values to API shape (flatten images array)
      const body = {
        ...values,
        tag: values.tag === '' ? null : values.tag,
        originalPrice: values.originalPrice || undefined,
        images: values.images.map((img) => img.url).filter(Boolean),
      };

      if (isEditing) {
        return apiFetch<{ product: ApiProduct }>(`${endpoint}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      }
      return apiFetch<{ product: ApiProduct }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      setSuccessMessage(isEditing ? 'Product updated!' : 'Product created!');
      if (!isEditing) {
        navigate('/products');
      }
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isEditing && (isError || !productData)) {
    return <Alert severity="error">Failed to load product.</Alert>;
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/products')}
        >
          Products
        </Link>
        <Typography color="text.primary">
          {isEditing ? 'Edit Product' : 'New Product'}
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        {isEditing ? 'Edit Product' : 'New Product'}
      </Typography>

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to save product. Please check the form and try again.
        </Alert>
      )}

      <ProductForm
        // Only pass defaultValues when data exists — exactOptionalPropertyTypes forbids passing undefined
        {...(productData?.product ? { defaultValues: productData.product } : {})}
        onSubmit={(values) => mutation.mutate(values)}
        isSubmitting={mutation.isPending}
      />

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
}
