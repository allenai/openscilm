import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link, Typography } from '@mui/material';
import { lighten } from '@mui/material/styles';
import * as React from 'react';

interface Props {
  open: boolean;
  onClose: (value: 'yes' | 'no' | 'unset') => void;
}

export const OptOut: React.FC<Props> = (props) => {
  const { onClose, open, ...other } = props;

  const handleCancel = () => {
    onClose('no');
  };

  const handleOk = () => {
    onClose('yes');
  };

  const consentPopover = (
      <Dialog
      maxWidth="xs"
      open={open}
      {...other}
      PaperProps={{
        sx: {
          backgroundColor: '#105257',
          color: (theme: any) => theme.color['off-white'].hex
        }
      }}
    >
      <DialogTitle sx={{ padding:'24px 24px 8px 24px', fontSize:'24px', fontFamily: '"PP Telegraf", "Manrope", sans-serif', fontWeight: 'bold', color: (theme: any) => theme.color['off-white'].hex }}>Consent to data collection</DialogTitle>
      <DialogContent sx={{ borderBottom: (theme: any) => `1px solid ${theme.color['off-white'].hex}33`, padding: '24px' }}>
        <DialogContentText id="alert-dialog-description" sx={{ color: (theme: any) => theme.color['off-white'].hex }}>
          <Typography sx={{ marginBottom:'8px', color: (theme: any) => theme.color['off-white'].hex }}>
            By using our demo, you agree to the <Link href="https://allenai.org/privacy-policy" target="_blank" sx={{
              color: (theme: any) => theme.color['green-100'].hex,
              transition: 'color 250ms ease-out',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}>Privacy Policy</Link>, <Link href="https://allenai.org/terms" target="_blank" sx={{
              color: (theme: any) => theme.color['green-100'].hex,
              transition: 'color 250ms ease-out',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}>Terms of Use</Link>, <Link href="https://allenai.org/responsible-use" target="_blank" sx={{
              color: (theme: any) => theme.color['green-100'].hex,
              transition: 'color 250ms ease-out',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}>Responsible Use</Link>, and that you will not submit any sensitive or confidential info.
          </Typography>
          <Typography sx={{ color: (theme: any) => theme.color['off-white'].hex }}>
            Ai2 may use your prompts and inputs in a public dataset for future AI research and development. You can still use this tool if you opt-out.
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ padding:'16px' } }>
        <Button onClick={handleCancel} sx={{
          color: (theme: any) => theme.color['off-white'].hex,
          transition: 'color 250ms ease-out',
          '&:hover': {
            color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
          }
        }}>Opt-out</Button>
        <Button onClick={handleOk} variant="contained" color="secondary" sx={{
          transition: 'background-color 250ms ease-out',
          '&:hover': {
            backgroundColor: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
          }
        }}>Ok to use my queries</Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <>
      {consentPopover}
    </>
  );
}
