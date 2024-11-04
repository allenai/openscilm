import {
  Box,
  FormControl,
  IconButton,
  styled,
  TextareaAutosize,
} from '@mui/material';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import PendingIcon from '@mui/icons-material/Pending';
import SendIcon from '@mui/icons-material/Send';
import { OptOut } from './OptOut';

type MessageBarProps = {
  onSend: (text: string) => Promise<any> | void;
  isPending?: boolean;
  placeholder?: string;
};

const ENTER_KEY = 'Enter' as const;

const MessageBar = ({
  onSend,
  isPending = false,
  placeholder = 'Type a question...',
}: MessageBarProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = React.useState('');
  const [optOut, setOptOut] = React.useState(false);

  const isEmpty = (text ?? '').trim().length === 0;

  const handleOnSend = useCallback(
    (event: React.ChangeEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isEmpty) {
        return;
      }
      onSend(text);
      setText('')
    },
    [onSend, setText, text, isEmpty],
  );

  const handleEnterKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // prevent the default behavior (new line) when Enter is pressed to submit the form
      // if shift + enter is pressed, a new line should be created
      if (event.key === ENTER_KEY && !event.shiftKey && formRef.current) {
        event.preventDefault();
        formRef.current.requestSubmit();
      }
    },
    [formRef],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    [setText],
  );

  return (
    <div>
      <StyledBox>
        <Form onSubmit={handleOnSend} ref={formRef}>
          <FormControl sx={{ width: '100%' }}>
            <Textarea
              ref={textAreaRef}
              placeholder={placeholder}
              data-testid="message-bar-input"
              onKeyDown={handleEnterKeyPress}
              onChange={handleChange}
              value={text}
            />
          </FormControl>

          <FormControl sx={{ alignSelf: 'flex-end' }}>
            <SendButton
              type="submit"
              data-testid="message-bar-submit-button"
              disabled={isEmpty || isPending}
            >
              {isPending ? <PendingIcon /> : <StyledSendIcon />}
            </SendButton>
          </FormControl>
        </Form>
      </StyledBox>
      <OptOut optOut={optOut} setOptOut={setOptOut} />
    </div>
  );
};

export default MessageBar;

const Textarea = styled(TextareaAutosize)`
  border: none;
  resize: none;
  color: #ffffff;
  background: none;

  &:focus {
    border: none;
  }

  // firefox
  &:focus-visible {
    outline: 0;
  }
`;

// Fix after theme test bug has been fixed
// border-radius: ${({ theme }) => `${theme.spacing(1.5)}`}
// padding: ${({ theme }) => `${theme.spacing(1.5)}`}
const StyledBox = styled(Box)`
  border-radius: 12px;
  padding: 12px;
  display: flex;
  background-color: #08232b;
  color: #ffffff;
`;

const Form = styled('form')`
  display: flex;
  align-items: center;
  width: 100%;
`;
// Fix after theme test bug has been fixed
// fill: ${({ theme }) => `${theme.palette.tertiary.light}`}
const SendButton = styled(IconButton)`
  border-radius: 6px;
  cursor: pointer;
  padding: 5px;
  &:hover svg {
    fill: rgba(63, 213, 163, 1);
  }
`;

// Fix after theme test bug has been fixed
// fill: ${({ theme }) => `${theme.palette.tertiary.main}`}
const StyledSendIcon = styled(SendIcon)`
  fill: rgba(15, 203, 140, 1);
`;
