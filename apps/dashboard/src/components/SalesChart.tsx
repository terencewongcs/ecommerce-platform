import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface DailyDataPoint {
  _id: string;    // "YYYY-MM-DD"
  revenue: number;
  orders: number;
}

interface SalesChartProps {
  data: DailyDataPoint[];
}

// Format "2025-03-20" → "Mar 20"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d._id),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Revenue — Last 7 Days
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#c5973e"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
