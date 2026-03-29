import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VendorRegisterSchema, type VendorRegisterInput } from '@trendyuniquellc/types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import MuiLink from '@mui/material/Link';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../lib/apiClient';

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const { user, vendorRegister } = useAuth();

  // Redirect already-authenticated vendors/admins away from this page
  useEffect(() => {
    if (user && user.role !== 'customer') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorRegisterInput>({ resolver: zodResolver(VendorRegisterSchema) });

  async function onSubmit(data: VendorRegisterInput) {
    try {
      await vendorRegister(data);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('email', { message: 'This email is already registered.' });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
    }
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="grey.100"
    >
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom align="center">
            TrendyUnique
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Create a Vendor Account
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box display="flex" gap={1}>
              <TextField
                label="First Name"
                fullWidth
                margin="normal"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                {...register('firstName')}
              />
              <TextField
                label="Last Name"
                fullWidth
                margin="normal"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                {...register('lastName')}
              />
            </Box>

            <TextField
              label="Store Name"
              fullWidth
              margin="normal"
              error={!!errors.storeName}
              helperText={errors.storeName?.message}
              {...register('storeName')}
            />

            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />

            {errors.root && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.root.message}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 3, py: 1.5 }}
            >
              {isSubmitting ? 'Creating account…' : 'Create Vendor Account'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Already have an account?{' '}
              <MuiLink component={Link} to="/login" underline="hover">
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
