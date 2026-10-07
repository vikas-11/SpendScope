import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import dayjs from 'dayjs';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { money, shortDate } from '../utils/format';
import EmptyState from '../components/EmptyState';

const monthLabel = (value) => dayjs(`${value}-01`).format('MMMM YYYY');
const compactMoney = (value) => {
  const amount = Number(value || 0);
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount >= 1000000 ? 0 : 1).replace(/\.0$/, '')}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return `₹${Math.round(amount)}`;
};

const buildDailySeries = (month, dailyTotals = []) => {
  const start = dayjs(`${month}-01`);
  if (!start.isValid()) return [];

  const amountByDay = new Map(
    dailyTotals.map((item) => [item.day, Number(item.amount || 0)]),
  );

  const today = dayjs();
  const endOfMonth = start.endOf('month');
  const end = start.isSame(today, 'month') ? today : endOfMonth;
  const result = [];

  for (let cursor = start; cursor.isBefore(end, 'day') || cursor.isSame(end, 'day'); cursor = cursor.add(1, 'day')) {
    const key = cursor.format('YYYY-MM-DD');
    result.push({
      day: cursor.format('D MMM'),
      amount: amountByDay.get(key) || 0,
    });
  }

  return result;
};

export default function DashboardPage() {
  const theme = useTheme();
  const light = theme.palette.mode === 'light';
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { openExpense } = useOutletContext();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard', { params: { month } });
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load the overview. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('expense:changed', handler);
    return () => window.removeEventListener('expense:changed', handler);
  }, [load]);

  const chartData = useMemo(
    () => buildDailySeries(month, data?.daily_totals || []),
    [month, data?.daily_totals],
  );
  const hasSpendData = Boolean(data?.daily_totals?.length);
  const increase = (data?.month_change_percent || 0) >= 0;
  const trendLabel = Number(data?.previous_month_total || 0) === 0 && Number(data?.total_spent || 0) > 0
    ? 'New vs last month'
    : `${Math.abs(data?.month_change_percent || 0).toFixed(1)}% vs last month`;

  const heroBg = light ? '#FFFDF8' : '#111315';
  const heroText = light ? '#111315' : '#F8F5EE';
  const heroMuted = light ? 'rgba(17,19,21,.58)' : 'rgba(255,255,255,.58)';
  const chartPanelBg = light ? '#F4F1E9' : 'rgba(255,255,255,.035)';
  const chartLine = light ? '#6E9800' : '#C8F54A';
  const gridStroke = light ? 'rgba(17,19,21,.08)' : 'rgba(255,255,255,.08)';
  const axisFill = light ? 'rgba(17,19,21,.52)' : 'rgba(255,255,255,.46)';

  if (loading && !data) {
    return <Box><Skeleton height={300} sx={{ borderRadius: '24px' }} /><Skeleton height={320} sx={{ mt: 2, borderRadius: '24px' }} /></Box>;
  }

  return (
    <Box>
      <Box className="reveal" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'end' }, gap: 2, mb: 2.5, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '.16em', fontWeight: 800 }}>MONTHLY MONEY STORY</Typography>
          <Typography variant="h3" sx={{ mt: .2 }}>{monthLabel(month)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <input
            aria-label="Overview month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ flex: 1, border: '1px solid rgba(127,127,127,.25)', borderRadius: 999, padding: '10px 14px', background: 'transparent', color: 'inherit', minWidth: 0 }}
          />
          <Button variant="contained" onClick={openExpense}>Log expense</Button>
        </Box>
      </Box>

      <Paper
        className="reveal reveal-delay-1"
        elevation={0}
        sx={{
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '24px',
          bgcolor: heroBg,
          color: heroText,
          boxShadow: light ? '0 18px 55px rgba(17,19,21,.04)' : 'none',
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, minHeight: 330 }}>
          <Box sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: heroMuted, fontWeight: 700 }}>You spent</Typography>
              <Typography sx={{ fontSize: { xs: 48, md: 72 }, fontWeight: 900, lineHeight: 1, letterSpacing: '-.065em', mt: .8 }}>{money(data?.total_spent)}</Typography>
              <Chip
                size="small"
                icon={increase ? <TrendingUpRoundedIcon /> : <TrendingDownRoundedIcon />}
                label={trendLabel}
                sx={{
                  mt: 2,
                  bgcolor: increase
                    ? alpha(theme.palette.secondary.main, light ? .14 : .16)
                    : alpha(theme.palette.primary.main, light ? .24 : .16),
                  color: heroText,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2, mt: 4 }}>
              {[['Transactions', data?.transaction_count || 0], ['Average', money(data?.average_expense)], ['Top category', data?.top_category || '—']].map(([label, value]) => (
                <Box key={label} sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: heroMuted, fontSize: 12 }}>{label}</Typography>
                  <Typography sx={{ fontWeight: 800, mt: .4, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 }, minHeight: { xs: 270, lg: 330 }, bgcolor: chartPanelBg, borderLeft: { lg: '1px solid' }, borderColor: 'divider' }}>
            {hasSpendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -18, bottom: 5 }}>
                  <defs>
                    <linearGradient id="spendGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartLine} stopOpacity={light ? 0.34 : 0.5} />
                      <stop offset="95%" stopColor={chartLine} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="4 6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: axisFill, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} width={50} tick={{ fill: axisFill, fontSize: 10 }} tickFormatter={compactMoney} />
                  <ChartTooltip
                    formatter={(value) => [money(value), 'Spent']}
                    contentStyle={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 14, background: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: '0 12px 30px rgba(0,0,0,.08)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={chartLine}
                    strokeWidth={3}
                    fill="url(#spendGlow)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: chartLine }}
                    dot={({ cx, cy, payload }) => (payload?.amount > 0 ? <circle cx={cx} cy={cy} r={4} fill={chartLine} stroke={heroBg} strokeWidth={2} /> : null)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', px: 3 }}>
                <Box>
                  <Typography fontWeight={850}>No spend curve yet</Typography>
                  <Typography sx={{ color: heroMuted, fontSize: 13, mt: .6 }}>Add an expense for {monthLabel(month)} and the daily trend will appear here.</Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr .85fr' }, gap: 2.5, mt: 2.5 }}>
        <Paper className="reveal reveal-delay-2" elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid', borderColor: 'divider', borderRadius: '24px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><Typography variant="h5" fontWeight={900}>Where it went</Typography><Typography color="text.secondary" fontSize={13}>share of monthly spend</Typography></Box>
          {data?.category_totals?.length ? data.category_totals.map((item, index) => (
            <Box key={item.category} sx={{ mb: 2.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: .8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}><Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: index === 0 ? 'secondary.main' : 'primary.main' }} /><Typography fontWeight={750}>{item.category}</Typography></Box>
                <Typography fontWeight={800}>{money(item.amount)} <Typography component="span" color="text.secondary" fontSize={12}>· {item.percentage.toFixed(0)}%</Typography></Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.min(item.percentage, 100)} sx={{ height: 7, borderRadius: 99, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: index === 0 ? 'secondary.main' : 'primary.main' } }} />
            </Box>
          )) : <EmptyState onAdd={openExpense} />}
        </Paper>

        <Paper className="reveal reveal-delay-3" elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, border: '1px solid', borderColor: 'divider', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={900}>Budget horizon</Typography>
            <Button component={Link} to="/budget" color="inherit" endIcon={<ArrowOutwardRoundedIcon />} size="small">Open</Button>
          </Box>
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', py: 3 }}>
            <Box sx={{ position: 'relative', width: 190, height: 190, display: 'grid', placeItems: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={190} thickness={3.4} sx={{ color: 'action.hover', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={Math.min(data?.budget_used_percent || 0, 100)} size={190} thickness={3.4} sx={{ color: (data?.budget_used_percent || 0) > 100 ? 'secondary.main' : 'primary.main', position: 'absolute' }} />
              <Box sx={{ textAlign: 'center' }}><Typography color="text.secondary" fontSize={12}>USED</Typography><Typography sx={{ fontSize: 36, fontWeight: 900, letterSpacing: '-.05em' }}>{(data?.budget_used_percent || 0).toFixed(0)}%</Typography></Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Box><Typography color="text.secondary" fontSize={12}>Budget</Typography><Typography fontWeight={850}>{money(data?.budget)}</Typography></Box>
            <Box sx={{ textAlign: 'right' }}><Typography color="text.secondary" fontSize={12}>Remaining</Typography><Typography fontWeight={850} color={Number(data?.remaining_budget) < 0 ? 'secondary.main' : 'text.primary'}>{money(data?.remaining_budget)}</Typography></Box>
          </Box>
        </Paper>
      </Box>

      <Paper className="reveal reveal-delay-3" elevation={0} sx={{ mt: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '24px', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2.5, md: 3.5 }, py: 2.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box><Typography variant="h5" fontWeight={900}>Latest movement</Typography><Typography color="text.secondary" fontSize={13}>Your most recent expenses</Typography></Box>
          <Button component={Link} to="/transactions" color="inherit" endIcon={<ArrowOutwardRoundedIcon />}>View ledger</Button>
        </Box>
        {data?.recent_expenses?.length ? data.recent_expenses.map((expense, index) => (
          <Box key={expense.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', md: '1.4fr .8fr .8fr auto' }, gap: 2, alignItems: 'center', px: { xs: 2.5, md: 3.5 }, py: 2, borderBottom: index < data.recent_expenses.length - 1 ? '1px solid' : 0, borderColor: 'divider' }}>
            <Box><Typography fontWeight={800}>{expense.title}</Typography><Typography color="text.secondary" fontSize={12}>{shortDate(expense.expense_date)}</Typography></Box>
            <Chip label={expense.category} size="small" sx={{ display: { xs: 'none', md: 'inline-flex' }, justifySelf: 'start' }} />
            <Typography color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>{expense.payment_method}</Typography>
            <Typography fontWeight={900}>{money(expense.amount)}</Typography>
          </Box>
        )) : <EmptyState onAdd={openExpense} />}
      </Paper>

      <Snackbar open={Boolean(error)} autoHideDuration={4200} onClose={() => setError('')}>
        <Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}
