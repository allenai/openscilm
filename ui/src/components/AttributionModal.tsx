import React from 'react';
import { Modal, Box, Typography, IconButton, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { lighten } from '@mui/material/styles';
import { SemanticScholarLogo } from './logos/SemanticScholarLogo';
import { UniversityOfWashingtonLogo } from './logos/UniversityOfWashingtonLogo';
import { Ai2Logo } from './logos/Ai2Logo';

interface AttributionModalProps {
  open: boolean;
  onClose: () => void;
}

export const AttributionModal: React.FC<AttributionModalProps> = ({ open, onClose }) => {
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
        <Typography variant="h5" sx={{
          marginBottom: '16px',
          fontSize: '24px',
          fontFamily: '"PP Telegraf", "Manrope", sans-serif',
          fontWeight: 'bold',
          color: (theme: any) => theme.color['off-white'].hex,
          paddingRight: '40px'
        }}>
          Attribution
        </Typography>
        <Typography sx={{
          marginBottom: '16px',
          color: (theme: any) => theme.color['off-white'].hex
        }}>
          This work is led by researchers from the University of Washington and Ai2, in collaboration with Meta, Carnegie Mellon University, the University of Illinois Urbana-Champaign, Stanford University, and the University of North Carolina, Chapel Hill. Akari Asai was supported by the Meta AI Mentorship program. We are grateful for support from the Singapore National Research Foundation and the National AI Group in the Singapore Ministry of Digital Development and Information under the AI Visiting Professorship Programme.
        </Typography>
        <Typography variant="h6" sx={{
          marginBottom: '16px',
          fontSize: '18px',
          fontFamily: '"PP Telegraf", "Manrope", sans-serif',
          fontWeight: 'bold',
          color: (theme: any) => theme.color['off-white'].hex
        }}>
          Powered by
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="https://allenai.org" target="_blank" sx={{ color: (theme: any) => theme.color['off-white'].hex, transition: 'color 250ms ease-out', '&:hover': { color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4) } }}>
            <Ai2Logo height="32px" />
          </Link>

          <Link href="https://www.semanticscholar.org" target="_blank" sx={{ color: (theme: any) => theme.color['off-white'].hex, transition: 'color 250ms ease-out', '&:hover': { color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4) } }}>
            <SemanticScholarLogo />
          </Link>

          <Link href="https://www.washington.edu" target="_blank" sx={{ color: (theme: any) => theme.color['off-white'].hex, transition: 'color 250ms ease-out', '&:hover': { color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4) } }}>
            <UniversityOfWashingtonLogo />
          </Link>
        </Box>
      </Box>
    </Modal>
  );
};
