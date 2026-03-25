import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import Snackbar from '@mui/material/Snackbar';
import UserTable from '../../components/UserTable';
import { apiFetch } from '../../lib/apiClient';
import type { ApiUser, UserRole, Pagination as PaginationType } from '../../lib/apiTypes';

type UsersResponse = { users: ApiUser[]; pagination: PaginationType };

export default function UserListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', page],
    queryFn: () => apiFetch<UsersResponse>(`/admin/users?page=${page}&limit=20`),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      apiFetch(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('Role updated!');
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
    return <Alert severity="error">Failed to load users.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Users
      </Typography>

      <UserTable
        users={data.users}
        onRoleChange={(id, role) => roleMutation.mutate({ id, role })}
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

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
}
