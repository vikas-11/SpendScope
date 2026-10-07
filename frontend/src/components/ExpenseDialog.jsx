import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';

export const categories = ['Food', 'Home', 'Transport', 'Work', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Other'];
export const paymentMethods = ['UPI', 'Card', 'Cash', 'Net Banking', 'Wallet', 'Other'];

const freshForm = () => ({
  title: '', amount: '', category: 'Food', expense_date: dayjs().format('YYYY-MM-DD'),
  payment_method: 'UPI', note: '', is_recurring: false,
});

export default function ExpenseDialog({ open, onClose, onSubmit, expense }) {
  const [form, setForm] = useState(freshForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (expense) {
      setForm({
        title: expense.title,
        amount: String(Number(expense.amount)),
        category: expense.category,
        expense_date: expense.expense_date,
        payment_method: expense.payment_method,
        note: expense.note || '',
        is_recurring: expense.is_recurring,
      });
    } else {
      setForm(freshForm());
    }
  }, [expense, open]);

  const change = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be greater than ₹0.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({ ...form, title: form.title.trim(), note: form.note.trim() || null, amount });
      setForm(freshForm());
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save this expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: 28, letterSpacing: '-0.04em', pt: 3 }}>{expense ? 'Edit expense' : 'Log a new expense'}</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}><TextField required fullWidth inputProps={{ maxLength: 140 }} label="What did you spend on?" value={form.title} onChange={change('title')} /></Grid>
            <Grid item xs={12} sm={4}><TextField required fullWidth type="number" inputProps={{ min: .01, step: .01 }} label="Amount (₹)" value={form.amount} onChange={change('amount')} /></Grid>
            <Grid item xs={12} sm={6}><TextField select fullWidth label="Category" value={form.category} onChange={change('category')}>{categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField required fullWidth type="date" label="Date" value={form.expense_date} onChange={change('expense_date')} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField select fullWidth label="Payment method" value={form.payment_method} onChange={change('payment_method')}>{paymentMethods.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}><FormControlLabel control={<Switch checked={form.is_recurring} onChange={(e) => setForm((prev) => ({ ...prev, is_recurring: e.target.checked }))} />} label="Recurring expense" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={3} inputProps={{ maxLength: 500 }} label="Note (optional)" value={form.note} onChange={change('note')} helperText={`${form.note.length}/500`} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
