import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';

const DISCLAIMER_TEXT = [
  `By using this feature, you agree to Ai2's terms and conditions and that you will not submit any sensitive or confidential info.`,
  `Ai2 may include your prompts and inputs in a public dataset for future AI research and development. Please check the box to opt-out.`
]

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

  const disclaimerElement = (
    <>
        {DISCLAIMER_TEXT.map((text) => (
          <Typography sx={{ p: 2, width: 300 }} key={text}>{text}</Typography>
        ))}
    </>
  )

  const consentPopover = (
      <Dialog
      sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
      maxWidth="xs"
      open={open}
      {...other}
    >
      <DialogTitle>Consent to data collection</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {disclaimerElement}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus color='secondary' onClick={handleOk}>I agree</Button>
        <Button onClick={handleCancel}>
          I disagree
        </Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <div style={{display: 'flex', justifyContent:' space-between', alignItems: 'center'}}>
      {consentPopover}
      <div>
        <a href="https://allenai.org" target="_blank" style={{ color: '#FAF2E9' }}>
        Ai2
        </a>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="https://allenai.org/privacy-policy" target="_blank" style={{ color: '#FAF2E9' }}>
          Privacy Policy
        </a>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="https://allenai.org/terms" target="_blank" style={{ color: '#FAF2E9' }}>
          Terms of Use
        </a>
      </div> 
    </div>
  );
}
