import * as React from 'react';
import { useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Button, Chip, Popover, Typography } from '@mui/material';

const DISCLAIMER_TEXT = [
  `By using this feature, you agree to Ai2's terms and conditions and that you will not submit any sensitive or confidential info.`,
  `Ai2 may include your prompts and inputs in a public dataset for future AI research and development. Please check the box to opt-out.`
]

interface Props {
  optOut: boolean;
  setOptOut: React.Dispatch<React.SetStateAction<boolean>>;
}

export const OptOut: React.FC<Props> = (props) => {
  const { optOut, setOptOut } = props;
  const handleCheckboxOnchang: React.MouseEventHandler<HTMLLabelElement> = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('optOut', optOut);
      setOptOut(old => !old);
    },
    [setOptOut],
  )
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'disclaimer-popover' : undefined;

  const labelElement = (
    <span>Do not publish my input data&nbsp;
      <Button aria-describedby={id} onClick={handleClick} size='small'>
        <Chip label="?" size="small" variant="outlined" color='secondary'/>
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        {DISCLAIMER_TEXT.map((text) => (
          <Typography sx={{ p: 2, width: 300 }} key={text}>{text}</Typography>
        ))}
      </Popover>
    </span>
  )

  return (
    <div style={{display: 'flex', justifyContent:' space-between', alignItems: 'center'}}>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={optOut} />} label={labelElement} onClick={handleCheckboxOnchang} />
      </FormGroup>
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
