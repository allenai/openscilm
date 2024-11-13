import {
  Box,
  FormControl,
  IconButton,
  styled,
  TextareaAutosize,
} from '@mui/material';
import React, { HtmlHTMLAttributes, KeyboardEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import PendingIcon from '@mui/icons-material/Pending';
import SendIcon from '@mui/icons-material/Send';
import { OptOut } from './OptOut';
import { useCookies } from 'react-cookie';
import { v4 as uuidv4 } from 'uuid';


type MessageBarProps = {
  onSend: (text: string, userId: string, optin: boolean) => Promise<any> | void;
  isPending?: boolean;
  placeholder?: string;
};

export type ConsentType = 'yes' | 'no' | 'unset';

const ENTER_KEY = 'Enter' as const;

const MessageBar = ({
  onSend,
  isPending = false,
  placeholder = 'Type a question...',
}: MessageBarProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = React.useState('');

  const isEmpty = (text ?? '').trim().length === 0;
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  const [cookiesConsent, setCookieConsent] = useCookies(['consented']);
  const [cookiesUserId, setCookieUserId] = useCookies(['userid']);
  if (!cookiesConsent.consented) {
    setCookieConsent('consented', { status: 'unset' }, { path: '/' });
  }
  if (!cookiesUserId.userid) {
    setCookieUserId('userid', { userId: uuidv4() }, { path: '/' });
  }
  const cookieConsent: ConsentType = cookiesConsent?.consented?.status ?? 'unset'
  const cookieUserId: string = cookiesUserId?.userid?.userId ?? 'unknown'
  console.log(cookieUserId)
  const [consent, setConsent] = useState(cookieConsent);
  useEffect(() => {
    setCookieConsent('consented', { status: consent }, { path: '/' });
  }, [consent])

  const handleOnSend = useCallback(
      (event?: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
      event?.preventDefault();
      console.log('handle on sent')
      if (isEmpty) {
        return;
      }
      if (consent  === 'unset') {
        console.log('Opening consent modal???');
        setConsentModalOpen(true);
      } else {
        onSend(text, cookieUserId, consent === 'yes');
        setText('')
      }
    },
    [onSend, setText, text, isEmpty, consent, setConsentModalOpen],
  );

  const handleConsentModalClose = useCallback((value: ConsentType) => {
    console.log('Set consent value:', value);
    setConsent(value);
    setConsentModalOpen(false);
  }, [setConsentModalOpen])

  const handleEnterKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // prevent the default behavior (new line) when Enter is pressed to submit the form
      // if shift + enter is pressed, a new line should be created
      if (event.key === ENTER_KEY && !event.shiftKey && formRef.current) {
        event.preventDefault();
        handleOnSend(event as React.KeyboardEvent<HTMLTextAreaElement>)
      }
    },
    [formRef, handleOnSend],
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
      <OptOut open={consentModalOpen} onClose={handleConsentModalClose} />
    </div>
  );
};

export default MessageBar;

const Textarea = styled(TextareaAutosize)`
  border: none;
  resize: none;
  color: #ffffff;
  background: none;
  font-family: 'manrope', arial, sans-serif;
  font-size: 16px;

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
