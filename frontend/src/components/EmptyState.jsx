import { Box, Typography, Button } from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

export default function EmptyState({ onAdd }) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Box sx={{ width: 58, height: 58, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: 'action.hover', display: 'grid', placeItems: 'center' }}>
        <ReceiptLongRoundedIcon />
      </Box>
      <Typography variant="h6" fontWeight={800}>No expenses here yet</Typography>
      <Typography color="text.secondary" sx={{ mt: .6, mb: 2.5 }}>Add your first transaction and your spending story will appear here.</Typography>
      <Button variant="contained" onClick={onAdd}>Add expense</Button>
    </Box>
  );
}
