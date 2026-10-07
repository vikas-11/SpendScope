import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton, MenuItem, Pagination, Paper, Snackbar, TextField, Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { categories, default as ExpenseDialog } from '../components/ExpenseDialog';
import { money, shortDate } from '../utils/format';
import EmptyState from '../components/EmptyState';
import { useOutletContext } from 'react-router-dom';

export default function TransactionsPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 15 });
  const [filters, setFilters] = useState({ search: '', category: 'All', month: dayjs().format('YYYY-MM'), page: 1 });
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();
  const { openExpense } = useOutletContext();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result } = await api.get('/expenses', { params: { ...filters, page_size: 15 } });
      setData(result);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('expense:changed', handler);
    return () => window.removeEventListener('expense:changed', handler);
  }, [load]);

  const notifyExpenseChanged = () => window.dispatchEvent(new Event('expense:changed'));

  const saveEdit = async (payload) => {
    await api.patch(`/expenses/${editing.id}`, payload);
    setMessage('Expense updated');
    setEditing(null);
    notifyExpenseChanged();
  };

  const remove = async (expense) => {
    if (!window.confirm(`Delete “${expense.title}”?`)) return;
    setBusy(true);
    try {
      await api.delete(`/expenses/${expense.id}`);
      setMessage('Expense deleted');
      notifyExpenseChanged();
      if (data.items.length === 1 && filters.page > 1) {
        setFilters((previous) => ({ ...previous, page: previous.page - 1 }));
      } else {
        await load();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete this expense.');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      const response = await api.get('/expenses/data/export', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'spendscope-expenses.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('CSV exported');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not export expenses.');
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data: result } = await api.post('/expenses/data/import', form);
      setMessage(`Imported ${result.imported}; skipped ${result.skipped}`);
      notifyExpenseChanged();
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not import this CSV file.');
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  };

  return (
    <Box>
      <Box className="reveal" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'end' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box><Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '.16em', fontWeight: 800 }}>PERSONAL LEDGER</Typography><Typography variant="h3">Every rupee, traceable.</Typography></Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <input type="file" accept=".csv,text/csv" hidden ref={fileRef} onChange={importCsv} />
          <Button color="inherit" startIcon={<UploadFileRoundedIcon />} onClick={() => fileRef.current?.click()} disabled={busy}>Import CSV</Button>
          <Button color="inherit" startIcon={<DownloadRoundedIcon />} onClick={exportCsv} disabled={busy}>Export</Button>
          <Button variant="contained" onClick={openExpense}>Add expense</Button>
        </Box>
      </Box>

      <Paper className="reveal reveal-delay-1" elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
        {loading && <Box sx={{ position: 'absolute', right: 20, top: 20, zIndex: 2 }}><CircularProgress size={22} /></Box>}
        <Box sx={{ p: 2.2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.6fr .7fr .7fr' }, gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))} placeholder="Search title or note" InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          <TextField select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value, page: 1 }))}>{['All', ...categories].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
          <TextField type="month" value={filters.month} onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value, page: 1 }))} />
        </Box>

        {data.items.length ? (
          <Box sx={{ opacity: loading ? .72 : 1, transition: 'opacity .2s ease' }}>
            <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '1.4fr .7fr .7fr .6fr 90px', gap: 2, px: 3, py: 1.4, bgcolor: 'action.hover' }}>
              {['Expense', 'Category', 'Payment', 'Amount', ''].map((label) => <Typography key={label || 'actions'} variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>)}
            </Box>
            {data.items.map((expense) => (
              <Box key={expense.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', md: '1.4fr .7fr .7fr .6fr 90px' }, gap: 2, alignItems: 'center', px: 3, py: 2.1, borderTop: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                <Box sx={{ minWidth: 0 }}><Typography fontWeight={850} noWrap>{expense.title}</Typography><Typography color="text.secondary" fontSize={12} noWrap>{shortDate(expense.expense_date)}{expense.note ? ` · ${expense.note}` : ''}</Typography></Box>
                <Chip size="small" label={expense.category} sx={{ display: { xs: 'none', md: 'inline-flex' }, justifySelf: 'start' }} />
                <Typography color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>{expense.payment_method}</Typography>
                <Typography fontWeight={900}>{money(expense.amount)}</Typography>
                <Box sx={{ display: 'flex', gridColumn: { xs: '1 / -1', md: 'auto' }, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
                  <IconButton aria-label={`Edit ${expense.title}`} size="small" onClick={() => setEditing(expense)} disabled={busy}><EditRoundedIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Delete ${expense.title}`} size="small" onClick={() => remove(expense)} disabled={busy}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        ) : !loading && <EmptyState onAdd={openExpense} />}

        {data.total > data.page_size && <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}><Pagination page={filters.page} count={Math.ceil(data.total / data.page_size)} onChange={(_, page) => setFilters((p) => ({ ...p, page }))} /></Box>}
      </Paper>

      <ExpenseDialog open={Boolean(editing)} expense={editing} onClose={() => setEditing(null)} onSubmit={saveEdit} />
      <Snackbar open={Boolean(message)} autoHideDuration={2500} onClose={() => setMessage('')}><Alert severity="success" variant="filled" onClose={() => setMessage('')}>{message}</Alert></Snackbar>
      <Snackbar open={Boolean(error)} autoHideDuration={4200} onClose={() => setError('')}><Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert></Snackbar>
    </Box>
  );
}
