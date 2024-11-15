import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link, Typography } from '@mui/material';

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
      sx={{ '& .MuiDialog-paper': { maxHeight: 435 } }}
      maxWidth="xs"
      open={open}
      {...other}
    >
      <DialogTitle>Consent to data collection</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <Typography sx={{ p: 2, width: 300 }}>
            By using Ai2 OpenScholar, you agree to the <Link href="https://allenai.org/privacy-policy" target="_blank">Privacy Policy</Link>, <Link href="https://allenai.org/terms" target="_blank" >Terms of Use</Link>, <Link href="https://allenai.org/responsible-use" target="_blank" >Responsible Use</Link>, and that you will not submit any sensitive or confidential info.
          </Typography>

          <Typography sx={{ p: 2, width: 300 }}>
            Ai2 may use your prompts and inputs in a public dataset for future AI research and development. You can still use this tool if you opt-out.
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus color='secondary' onClick={handleOk}>Ok to use my queries</Button>
        <Button onClick={handleCancel}>Opt-out</Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <>
      {consentPopover}
    </>
  );
}
