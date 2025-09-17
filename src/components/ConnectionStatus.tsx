import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { 
  WifiOff as WifiOffIcon, 
  Wifi as WifiIcon, 
  Error as ErrorIcon 
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';

interface ConnectionStatusProps {
  variant?: 'default' | 'compact';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  variant = 'default' 
}) => {
  const { isConnected, error } = useChat();

  const getStatusConfig = () => {
    if (error) {
      return {
        color: 'error' as const,
        icon: <ErrorIcon fontSize="small" />,
        label: 'Connection Error',
        message: error,
      };
    }
    
    if (isConnected) {
      return {
        color: 'success' as const,
        icon: <WifiIcon fontSize="small" />,
        label: 'Connected',
        message: 'Real-time chat is active',
      };
    }
    
    return {
      color: 'warning' as const,
      icon: <WifiOffIcon fontSize="small" />,
      label: 'Disconnected',
      message: 'Attempting to reconnect...',
    };
  };

  const status = getStatusConfig();

  if (variant === 'compact') {
    return (
      <Chip
        icon={status.icon}
        label={status.label}
        color={status.color}
        variant="outlined"
        size="small"
        sx={{
          fontWeight: 500,
          '& .MuiChip-icon': {
            fontSize: '16px',
          },
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderRadius: 1,
        bgcolor: status.color === 'error' ? 'error.light' : 
                status.color === 'success' ? 'success.light' : 'warning.light',
        border: 1,
        borderColor: status.color === 'error' ? 'error.main' : 
                    status.color === 'success' ? 'success.main' : 'warning.main',
        mb: 1,
      }}
    >
      {status.icon}
      <Box>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {status.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {status.message}
        </Typography>
      </Box>
    </Box>
  );
};

export default ConnectionStatus;