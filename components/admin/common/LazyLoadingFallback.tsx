import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LazyLoadingFallbackProps {
  component?: string;
  height?: number | string;
}

export default function LazyLoadingFallback({ 
  component = 'component', 
  height = 200 
}: LazyLoadingFallbackProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        gap: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 1,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary">
        Loading {component}...
      </Typography>
    </Box>
  );
}