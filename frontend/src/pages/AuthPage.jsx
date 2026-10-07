import { useState } from 'react';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode = 'login' }) {
  const loginMode = mode === 'login';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (loginMode) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.15fr .85fr' }, bgcolor: 'background.default' }}>
      <Box sx={{ position: 'relative', overflow: 'hidden', p: { xs: 3, md: 6 }, minHeight: { xs: 280, md: '100vh' }, bgcolor: '#111315', color: '#F8F5EE', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', bgcolor: '#C8F54A', filter: 'blur(3px)', right: '-12%', top: '-12%', opacity: .96, animation: 'drift 8s ease-in-out infinite' }} />
        <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '46% 54% 68% 32% / 42% 38% 62% 58%', bgcolor: '#FF6B4A', left: '18%', bottom: '8%', opacity: .92, animation: 'drift 10s ease-in-out infinite reverse' }} />
        <Box sx={{ position: 'relative', zIndex: 1, '& *': { color: 'inherit !important' } }}><Brand /></Box>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 620 }}>
          <Typography sx={{ fontSize: { xs: 44, md: 72 }, fontWeight: 900, lineHeight: .95, letterSpacing: '-0.065em' }}>
            Your money,<br />made visible.
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 470, color: 'rgba(255,255,255,.72) !important', fontSize: { xs: 16, md: 18 } }}>
            A private financial workspace that turns everyday expenses into a clear monthly story — without exposing one user’s data to another.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1.2, color: 'rgba(255,255,255,.72) !important' }}>
            <LockRoundedIcon fontSize="small" /> JWT-secured personal accounts
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 3, md: 6 } }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 440, bgcolor: 'transparent' }}>
          <Typography variant="h3">{loginMode ? 'Welcome back.' : 'Create your space.'}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>{loginMode ? 'Sign in to continue your money story.' : 'Start with a private account in under a minute.'}</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            {!loginMode && <TextField required label="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
            <TextField required type="email" label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField required type="password" label="Password" helperText={!loginMode ? 'Use at least 8 characters.' : ''} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />} disabled={loading} sx={{ mt: 1, justifyContent: 'space-between', px: 2.4, py: 1.35 }}>
              {loading ? 'Please wait…' : loginMode ? 'Enter SpendScope' : 'Create account'}
            </Button>
          </Box>

          <Typography color="text.secondary" sx={{ mt: 3 }}>
            {loginMode ? 'New here?' : 'Already have an account?'}{' '}
            <Typography component={Link} to={loginMode ? '/register' : '/login'} sx={{ color: 'text.primary', fontWeight: 800, textDecoration: 'none' }}>
              {loginMode ? 'Create account' : 'Sign in'}
            </Typography>
          </Typography>
          {loginMode && (
            <Box sx={{ mt: 4, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
              <Typography variant="caption" color="text.secondary">Seeded demo: demo@spendscope.dev / Demo@123</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
