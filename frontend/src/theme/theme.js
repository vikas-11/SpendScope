import { createTheme } from '@mui/material/styles';

export const buildTheme = (mode = 'light') => {
  const light = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: { main: '#C8F54A', contrastText: '#10130A' },
      secondary: { main: '#FF6B4A' },
      background: {
        default: light ? '#F2EFE8' : '#0C0E10',
        paper: light ? '#FFFDF8' : '#15181B',
      },
      text: {
        primary: light ? '#111315' : '#F7F4EC',
        secondary: light ? '#6B6A66' : '#A4A6A8',
      },
      divider: light ? 'rgba(17,19,21,.10)' : 'rgba(255,255,255,.10)',
      success: { main: '#36B37E' },
      warning: { main: '#F5A623' },
      error: { main: '#E35656' },
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.05em' },
      h2: { fontWeight: 800, letterSpacing: '-0.045em' },
      h3: { fontWeight: 750, letterSpacing: '-0.03em' },
      button: { textTransform: 'none', fontWeight: 750 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': { colorScheme: mode },
          'input[type="month"], input[type="date"]': { colorScheme: mode },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 18,
            boxShadow: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 14 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 28 },
        },
      },
    },
  });
};
