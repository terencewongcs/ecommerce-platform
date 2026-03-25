import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { ApiUser, UserRole } from '../lib/apiTypes';

interface UserTableProps {
  users: ApiUser[];
  onRoleChange: (id: string, role: UserRole) => void;
}

const ROLE_COLOR: Record<UserRole, 'default' | 'error' | 'warning'> = {
  customer: 'default',
  admin: 'error',
  vendor: 'warning',
};

const columnHelper = createColumnHelper<ApiUser>();

export default function UserTable({ users, onRoleChange }: UserTableProps) {
  const columns = [
    columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
      id: 'name',
      header: 'Name',
    }),
    columnHelper.accessor('email', {
      header: 'Email',
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => (
        <Chip
          label={info.getValue()}
          color={ROLE_COLOR[info.getValue()]}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Joined',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Change Role',
      cell: (info) => (
        <Select
          size="small"
          value={info.row.original.role}
          onChange={(e) => onRoleChange(info.row.original._id, e.target.value as UserRole)}
          sx={{ fontSize: 13, minWidth: 110 }}
        >
          <MenuItem value="customer">Customer</MenuItem>
          <MenuItem value="vendor">Vendor</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell key={header.id} sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
