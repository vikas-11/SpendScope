import { Box, Typography } from '@mui/material';

export default function Brand({ compact = false }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Box
        sx={{
          width: compact ? 30 : 36,
          height: compact ? 30 : 36,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 950,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        S
      </Box>
      <Typography sx={{ fontWeight: 900, letterSpacing: '-0.04em', fontSize: compact ? 18 : 22 }}>
        SpendScope
      </Typography>
    </Box>
  );
}
