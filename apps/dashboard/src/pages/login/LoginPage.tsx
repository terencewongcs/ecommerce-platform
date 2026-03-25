import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../hooks/useAuth';

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Redirect already-authenticated admin/vendor users to the dashboard
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
  } = useForm<FormValues>();

  async function onSubmit({ email, password }: FormValues) {
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('root', { message: 'Invalid email or password. Please try again.' });
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
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom align="center">
            TrendyUnique
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Admin Dashboard
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
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
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
