import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Skeleton, Snackbar, TextField, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import TipsAndUpdatesRoundedIcon from '@mui/icons-material/TipsAndUpdatesRounded';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { money } from '../utils/format';

const cleanAmountInput = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [whole = '', ...fractionParts] = cleaned.split('.');
  if (!fractionParts.length) return whole;
  return `${whole}.${fractionParts.join('').slice(0, 2)}`;
};

export default function BudgetPage() {
  const theme = useTheme();
  const light = theme.palette.mode === 'light';
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, existing] = await Promise.all([
        api.get('/dashboard', { params: { month } }),
        api.get(`/budgets/${month}`),
      ]);
      setSummary(dashboard.data);
      setBudget(existing.data?.limit_amount ? String(Number(existing.data.limit_amount)) : '');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load budget details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const numericBudget = useMemo(() => Number(budget), [budget]);
  const budgetInvalid = budget !== '' && (!Number.isFinite(numericBudget) || numericBudget <= 0);

  const save = async (event) => {
    event.preventDefault();
    if (!budget || budgetInvalid) {
      setError('Enter a budget greater than ₹0.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/budgets/${month}`, { month, limit_amount: numericBudget });
      setMessage('Monthly budget saved');
      setError('');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save the budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const usedRaw = Number(summary?.budget_used_percent || 0);
  const used = Math.min(Math.max(usedRaw, 0), 100);
  const over = usedRaw > 100;

  if (loading && !summary) {
    return <Box><Skeleton height={90} sx={{ mb: 2, borderRadius: 4 }} /><Skeleton height={500} sx={{ borderRadius: 6 }} /></Box>;
  }

  return (
    <Box>
      <Box className="reveal" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'end' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box><Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '.16em', fontWeight: 800 }}>BUDGET LAB</Typography><Typography variant="h3">Give the month a boundary.</Typography></Box>
        <input
          aria-label="Budget month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ border: '1px solid rgba(127,127,127,.25)', borderRadius: 999, padding: '10px 14px', background: 'transparent', color: 'inherit' }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.25fr .75fr' }, gap: 2.5 }}>
        <Paper className="reveal reveal-delay-1" elevation={0} sx={{ minHeight: 470, p: { xs: 3, md: 5 }, borderRadius: '24px', border: '1px solid', borderColor: 'divider', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '.9fr 1.1fr' }, alignItems: 'center', gap: 4 }}>
          <Box sx={{ display: 'grid', placeItems: 'center' }}>
            <Box sx={{ position: 'relative', width: { xs: 220, sm: 260 }, height: { xs: 220, sm: 260 }, display: 'grid', placeItems: 'center' }}>
              <CircularProgress variant="determinate" value={100} size="100%" thickness={2.4} sx={{ color: 'action.hover', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={used} size="100%" thickness={2.4} sx={{ color: over ? 'secondary.main' : 'primary.main', position: 'absolute' }} />
              <Box sx={{ textAlign: 'center' }}><Typography color="text.secondary" fontSize={12}>SPENT</Typography><Typography sx={{ fontSize: 48, fontWeight: 900, letterSpacing: '-.06em' }}>{usedRaw.toFixed(0)}%</Typography><Typography color="text.secondary">of this month’s limit</Typography></Box>
            </Box>
          </Box>

          <Box>
            <Typography variant="h4" fontWeight={900}>{over ? 'You crossed the line.' : summary?.budget ? 'You still have room.' : 'Set your monthly runway.'}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1.2, mb: 4, maxWidth: 460 }}>
              {over
                ? 'Your spending is above the monthly budget. Use the ledger to find the categories creating the pressure.'
                : summary?.budget
                  ? 'A budget is not a restriction — it is a reference point. SpendScope shows exactly how much runway remains.'
                  : 'Choose a budget for this month and SpendScope will track how much is used and how much remains.'}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 1.5 }}>
              {[['Budget', money(summary?.budget)], ['Spent', money(summary?.total_spent)], ['Remaining', money(summary?.remaining_budget)], ['Transactions', summary?.transaction_count || 0]].map(([label, value]) => (
                <Box key={label} sx={{ p: 2, borderRadius: 4, bgcolor: 'action.hover' }}><Typography color="text.secondary" fontSize={12}>{label}</Typography><Typography fontWeight={900} fontSize={20}>{value}</Typography></Box>
              ))}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Paper className="reveal reveal-delay-2" elevation={0} sx={{ p: 3.2, borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ width: 46, height: 46, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', mb: 2 }}><SavingsRoundedIcon /></Box>
            <Typography variant="h5" fontWeight={900}>Set monthly budget</Typography>
            <Typography color="text.secondary" sx={{ mt: .8, mb: 2.5 }}>Change it anytime. The dashboard recalculates your remaining runway immediately.</Typography>
            <Box component="form" onSubmit={save} sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                required
                type="text"
                label="Budget amount (₹)"
                value={budget}
                onChange={(e) => setBudget(cleanAmountInput(e.target.value))}
                error={budgetInvalid}
                helperText={budgetInvalid ? 'Enter an amount greater than ₹0.' : 'Exact values such as 9,000 or 10,000 are supported.'}
                inputProps={{ inputMode: 'decimal', 'aria-label': 'Budget amount' }}
              />
              <Button type="submit" variant="contained" disabled={saving || budgetInvalid || !budget}>{saving ? 'Saving…' : 'Save budget'}</Button>
            </Box>
          </Paper>

          <Paper
            className="reveal reveal-delay-3"
            elevation={0}
            sx={{
              p: 3.2,
              borderRadius: '24px',
              border: '1px solid',
              borderColor: light ? alpha(theme.palette.primary.main, .55) : 'divider',
              bgcolor: light ? alpha(theme.palette.primary.main, .13) : '#111315',
              color: light ? 'text.primary' : '#F8F5EE',
            }}
          >
            <TipsAndUpdatesRoundedIcon sx={{ color: light ? '#6E9800' : '#C8F54A' }} />
            <Typography fontWeight={900} fontSize={20} sx={{ mt: 1.2 }}>Quick read</Typography>
            <Typography sx={{ color: light ? 'text.secondary' : 'rgba(255,255,255,.66)', mt: .8 }}>
              {summary?.top_category ? `${summary.top_category} is your biggest category this month. Your average transaction is ${money(summary.average_expense)}.` : 'Add a few expenses and SpendScope will surface a simple monthly insight here.'}
            </Typography>
          </Paper>
        </Box>
      </Box>

      <Snackbar open={Boolean(message)} autoHideDuration={2400} onClose={() => setMessage('')}><Alert severity="success" variant="filled" onClose={() => setMessage('')}>{message}</Alert></Snackbar>
      <Snackbar open={Boolean(error)} autoHideDuration={4200} onClose={() => setError('')}><Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert></Snackbar>
    </Box>
  );
}
