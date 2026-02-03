import React from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { lighten } from '@mui/material/styles';

interface DisclaimerModalProps {
  open: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90vw',
        maxWidth: '800px',
        backgroundColor: '#105257',
        color: (theme: any) => theme.color['off-white'].hex,
        boxShadow: 24,
        padding: {xs: '16px', sm: '24px'},
        borderRadius: '4px'
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: (theme: any) => theme.color['off-white'].hex,
            '&:hover': {
              color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
            }
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{
          marginBottom: '16px',
          fontSize: '24px',
          fontFamily: '"PP Telegraf", "Manrope", sans-serif',
          fontWeight: 'bold',
          color: (theme: any) => theme.color['off-white'].hex,
          paddingRight: '40px'
        }}>
          Disclaimer
        </Typography>
        <Typography sx={{
          marginBottom: '12px',
          color: (theme: any) => theme.color['off-white'].hex
        }}>
          Our demo answers questions by retrieving open-access papers from the scientific literature. It is not designed to answer non-scientific questions or questions that require sources outside the scientific literature.
        </Typography>
        <Typography sx={{
          color: (theme: any) => theme.color['off-white'].hex
        }}>
          Its output may have errors, and these errors might be difficult to detect. For example, there might be serious factual inaccuracies or omissions. Please verify the accuracy of the generated text whenever possible.
        </Typography>
      </Box>
    </Modal>
  );
};
