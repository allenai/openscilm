import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { lighten } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AstaLogo } from './logos/AstaLogo';

export const AstaBanner: React.FC = () => {
  const theme = useTheme();
  const hasSeenBanner = localStorage.getItem('astaBannerSeen') === 'true';
  const [showBanner, setShowBanner] = useState(hasSeenBanner);

  useEffect(() => {
    if (!hasSeenBanner) {
      // First time - show with animation after delay
      const timer = setTimeout(() => {
        setShowBanner(true);
        localStorage.setItem('astaBannerSeen', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasSeenBanner]);

  return (
    <Box
      onClick={() => window.open('https://asta.allen.ai?utm_source=OpenSciLM', '_blank')}
      sx={{
        position: 'fixed',
        bottom: showBanner ? '36px' : '-200px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '800px',
        width: 'calc(100% - 32px)',
        padding: '18px',
        borderRadius: '4px',
        backgroundColor: (theme) => theme.color['teal-100'].hex,
        cursor: 'pointer',
        transition: 'bottom 0.5s ease-out, background-color 250ms ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        '&:hover': {
          backgroundColor: (theme) => lighten(theme.color['teal-100'].hex, 0.1),
          '& .arrow-icon': {
            color: (theme) => theme.color['green-100'].hex,
          }
        }
      }}
    >
      <AstaLogo height="18px" fill={theme.color['green-100'].hex} />
      <Typography sx={{
        fontFamily: '"Manrope", sans-serif',
        fontSize: '16px',
        color: (theme) => theme.color['off-white'].hex,
        lineHeight: '1.5',
        flex: 1
      }}>
        Try Asta, a scholarly research assistant from Ai2
      </Typography>
      <ArrowForwardIcon
        className="arrow-icon"
        sx={{
          color: (theme) => theme.color['off-white'].hex,
          transition: 'color 250ms ease-out',
          fontSize: '20px'
        }}
      />
    </Box>
  );
};
