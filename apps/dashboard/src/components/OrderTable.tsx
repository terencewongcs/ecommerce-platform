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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { ApiOrder, OrderStatus } from '../lib/apiTypes';

interface OrderTableProps {
  orders: ApiOrder[];
  onView: (id: string) => void;
}

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

const columnHelper = createColumnHelper<ApiOrder>();

export default function OrderTable({ orders, onView }: OrderTableProps) {
  const columns = [
    columnHelper.accessor('_id', {
      header: 'Order ID',
      cell: (info) => info.getValue().slice(-8).toUpperCase(),
    }),
    columnHelper.accessor((row) => `${row.shippingAddress.firstName} ${row.shippingAddress.lastName}`, {
      id: 'customer',
      header: 'Customer',
    }),
    columnHelper.accessor('items', {
      header: 'Items',
      cell: (info) => info.getValue().length,
    }),
    columnHelper.accessor('total', {
      header: 'Total',
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Chip
          label={info.getValue()}
          color={STATUS_COLOR[info.getValue()]}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(info.row.original._id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    }),
  ];

  const table = useReactTable({
    data: orders,
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
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
