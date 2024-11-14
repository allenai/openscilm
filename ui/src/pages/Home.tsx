import React, { useCallback } from 'react';
import {  
  Box,
  Typography,
  Link,
  styled,
  alpha,
  Grid
} from '@mui/material';
import MessageBar from '../components/widgets/MessageBar';
import { useNavigate } from "react-router-dom";
import { CircularProgress } from '@mui/material';

import { createTask } from '../api/utils';
import { useQueryHistory } from '../components/shared';

const SUGGESTIONS: { link: string, shortName: string }[] = [
  {link: 'https://open-scholar.allen.ai/query/303bed4a-3988-42a4-a60f-d321a698b66e', shortName: 'Compare two papers'},
  {link: 'https://open-scholar.allen.ai/query/9cc9b2f9-52d4-4660-9845-4e1272d178a4', shortName: 'SWE-bench leaderboard'},
  {link: 'https://open-scholar.allen.ai/query/28cd2f86-22fa-4168-9220-340daf0c8ec6', shortName: 'Scaling retrieval-augmented LMs'}
]

export const Home = () => {

  const navigate = useNavigate();

  const {history, setHistory} = useQueryHistory();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleSubmit = useCallback(async (query: string, userId: string, optin: boolean = false) => {
    console.log(query)
    setIsLoading(true);
    setIsLoading(false);

    const newStatus = await createTask(query, optin, userId);
    console.log(newStatus, newStatus.task_id);
    if (newStatus.task_id) {
      navigate(`/query/${newStatus.task_id}`, { replace: true });
      if (!history[newStatus.task_id]) {
        setHistory({
          ...history,
          [newStatus.task_id]: {
            query: newStatus.query, taskId: newStatus.task_id, timestamp: Date.now()
          }
        });
      }
    }
  }, []);

  return (
    <>
      <Box sx={{ alignItems:'center', display: 'flex', flexGrow: '1', flexDirection: 'column', justifyContent: 'center', padding: {xs: '120px 16px 16px 16px', sm: '240px 32px 32px 32px'}, width: '100%'}}>
        <Box sx={{maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          
          <Box sx={{display: `flex`, justifyContent: 'space-between', alignItems: 'baseline'}}>


            <Box sx={{height: {xs:'32px', sm:'42px'}, width:{xs:'260px', sm:'340px'} }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 404.3 49.8">
                <path fill="#EF529B" d="M12.3,21.5h-6.1v-5.9h4.9c.7,0,1.2-.5,1.2-1.2v-5h5.8v6.2c0,3.3-2.6,5.9-5.8,5.9ZM6.1,22.1H0v5.9h4.9c.7,0,1.2.5,1.2,1.2v5h5.8v-6.2c0-3.3-2.6-5.9-5.8-5.9ZM25.8,21.8c-.7,0-1.2-.5-1.2-1.2v-5h-5.8v6.2c0,3.3,2.6,5.9,5.8,5.9h6.1v-5.9h-4.9ZM12.6,34.3v6.2h5.8v-5c0-.7.5-1.2,1.2-1.2h4.9v-5.9h-6.1c-3.2,0-5.8,2.7-5.8,5.9Z"/>
                <path fill="#EF529B" d="M390.7,17.1h4.6v5.6c1.6-4,4.4-6,8.3-6h.7v4.5h-1.2c-3,0-5,.9-6.1,2.6-1.1,1.7-1.6,4.2-1.6,7.7v8.9h-4.7v-23.3Z"/>
                <path fill="#EF529B" d="M372.2,41.1c-2.4,0-4.3-.6-5.7-1.8-1.4-1.2-2.1-2.9-2.1-5s.5-3.5,1.6-4.6c1.1-1.2,2.9-2,5.5-2.4l5.8-1c1.2-.2,2-.5,2.5-.9.5-.4.8-1,.8-1.8,0-1.2-.4-2-1.2-2.6-.7-.6-2.1-.9-4-.9s-3.3.4-4.3,1.1c-.9.7-1.5,1.9-1.6,3.4h-4.7c0-2.5.9-4.5,2.8-5.9,1.8-1.4,4.3-2.1,7.6-2.1s5.5.7,7.1,2c1.6,1.3,2.5,3.1,2.5,5.3v11.6c0,1.7,0,3.5.2,5.3h-4.2c-.2-1.8-.3-3.6-.3-5.3-.5,1.7-1.5,3.1-2.9,4.2-1.4,1.1-3.3,1.7-5.6,1.7ZM373.2,37.5c2.4,0,4.2-.8,5.5-2.3,1.3-1.6,2-3.6,2-6v-1.4c-.6.4-1.2.7-1.8,1-.7.2-1.4.4-2.3.7l-3.2.7c-1.5.3-2.5.8-3.2,1.4-.7.6-1,1.4-1,2.5s.4,1.9,1.1,2.6c.7.6,1.7.9,3,.9Z"/>
                <path fill="#EF529B" d="M354.6,7.8h4.7v32.7h-4.7V7.8Z"/>
                <path fill="#EF529B" d="M337.8,41.2c-2.6,0-4.8-.5-6.6-1.6-1.8-1.1-3.2-2.6-4.1-4.4-.9-1.9-1.4-4-1.4-6.4s.4-4.4,1.4-6.3c.9-1.9,2.3-3.3,4.1-4.4,1.8-1.1,4-1.6,6.6-1.6s4.8.5,6.6,1.6c1.8,1.1,3.2,2.6,4.1,4.5.9,1.9,1.4,4,1.4,6.3s-.4,4.4-1.4,6.3c-.9,1.9-2.3,3.4-4.1,4.5-1.8,1.1-4,1.6-6.6,1.6ZM330.4,28.8c0,3.1.6,5.3,1.7,6.7,1.2,1.3,3,2,5.6,2s4.4-.7,5.6-2c1.2-1.4,1.8-3.6,1.8-6.7s-.6-5.3-1.8-6.6c-1.2-1.4-3-2.1-5.6-2.1s-4.4.7-5.6,2.1c-1.2,1.3-1.7,3.5-1.7,6.6Z"/>
                <path fill="#EF529B" d="M299.8,7.8h4.7v14.6c1.6-4,4.4-6,8.4-6s5.2.8,6.5,2.4c1.3,1.6,2,4,2,7.1v14.6h-4.7v-14.1c0-2.3-.5-3.8-1.4-4.7-.9-.9-2.2-1.4-3.8-1.4-2.4,0-4.1.8-5.3,2.5-1.2,1.6-1.8,4.3-1.8,7.9v9.8h-4.7V7.8Z"/>
                <path fill="#EF529B" d="M271.8,28.8c0-2.4.5-4.5,1.4-6.3.9-1.9,2.3-3.3,4.1-4.4,1.8-1.1,4-1.6,6.5-1.6s6.2.9,8.1,2.6c1.9,1.7,3,4,3.1,6.9h-4.4c-.2-1.7-.9-3.1-1.9-4.2s-2.6-1.6-4.7-1.6-4.2.7-5.5,2.1c-1.3,1.3-1.9,3.5-1.9,6.6s.6,5.3,1.9,6.7c1.2,1.3,3.1,2,5.5,2s3.8-.5,4.9-1.6c1.1-1.1,1.8-2.6,2.1-4.4h4.4c0,1.8-.5,3.4-1.4,4.9-.9,1.5-2.1,2.6-3.8,3.5-1.7.9-3.7,1.3-6.1,1.3s-4.7-.5-6.5-1.6c-1.8-1.1-3.2-2.6-4.1-4.4s-1.4-4-1.4-6.3Z"/>
                <path fill="#EF529B" d="M246.8,30.1c.2,4.9,3.1,7.4,9,7.4s4.9-.5,6.1-1.4c1.1-.9,1.7-2.2,1.7-4s-.4-2.6-1.3-3.4c-.8-.8-2.1-1.4-3.9-1.6l-7.2-1c-5.4-.7-8-3.5-8-8.4s1-4.9,3.1-6.6c2.1-1.7,5.1-2.6,9.1-2.6s7.2.9,9.3,2.8c2.1,1.8,3.3,4.2,3.5,7.2h-4.7c-.2-2-1-3.5-2.4-4.6-1.3-1.1-3.3-1.6-5.8-1.6s-4.2.5-5.5,1.4c-1.2.9-1.8,2.2-1.8,3.9s.3,2.2,1,2.9c.7.7,1.7,1.2,3.1,1.4l7.6,1.1c2.8.4,5,1.3,6.4,2.7,1.5,1.3,2.2,3.3,2.2,5.7,0,6.4-4.2,9.7-12.6,9.7s-8.2-1-10.4-3.1c-2.2-2.1-3.3-4.8-3.3-8h4.7Z"/>
                <path fill="#EF529B" d="M215.9,17.1h4.7v5.2c1.6-4,4.4-6,8.4-6s5.2.8,6.5,2.4c1.3,1.6,2,4,2,7.1v14.6h-4.7v-14.1c0-2.3-.5-3.8-1.4-4.7-.9-.9-2.2-1.4-3.8-1.4-2.4,0-4.1.8-5.3,2.5-1.2,1.6-1.8,4.3-1.8,7.9v9.8h-4.7v-23.3Z"/>
                <path fill="#EF529B" d="M200.1,41.2c-4,0-6.9-1.2-8.9-3.5-2-2.3-2.9-5.3-2.9-9s.4-4.4,1.3-6.3c.9-1.9,2.2-3.3,4-4.4,1.8-1.1,4-1.6,6.5-1.6s4.4.5,6.1,1.6c1.7,1,3,2.4,3.8,4.2.9,1.8,1.3,3.8,1.3,6.1s0,1.4,0,1.8h-18.4c.2,2.8.9,4.7,2.2,5.9,1.3,1.2,3,1.7,5.2,1.7,3.7,0,6-1.4,6.8-4.3h4.3c-.3,2.1-1.3,3.9-3.1,5.5-1.7,1.6-4.4,2.3-8.1,2.3ZM206.8,26.7c-.2-4.6-2.5-6.9-6.7-6.9s-3.8.5-5,1.6c-1.2,1-2,2.8-2.2,5.3h14Z"/>
                <path fill="#EF529B" d="M173.9,41.2c-4.1,0-7-1.6-8.6-4.8v13.3h-4.7V17.1h4.7v4c1.6-3.2,4.5-4.8,8.6-4.8s6.3,1.2,8.1,3.5c1.8,2.3,2.8,5.3,2.8,8.9s-.9,6.6-2.8,9c-1.8,2.3-4.5,3.5-8.1,3.5ZM172.9,37.5c2.6,0,4.4-.7,5.5-2.1,1.1-1.4,1.7-3.6,1.7-6.6s-.6-5.1-1.7-6.5c-1.1-1.4-2.9-2.1-5.5-2.1-5.1,0-7.7,2.9-7.7,8.7s2.6,8.7,7.7,8.7Z"/>
                <path fill="#EF529B" d="M139.9,41.3c-5.3,0-9.2-1.5-11.9-4.5-2.6-3-3.9-7-3.9-11.9s.5-5.9,1.6-8.4c1.1-2.5,2.8-4.4,5.2-5.8,2.4-1.4,5.3-2.1,8.9-2.1s6.5.7,8.9,2.1c2.4,1.4,4.1,3.4,5.2,5.8,1.1,2.5,1.7,5.2,1.7,8.4s-.6,5.9-1.7,8.4c-1.1,2.5-2.8,4.4-5.2,5.8-2.3,1.4-5.3,2.1-8.9,2.1ZM129.2,24.9c0,4.2.8,7.3,2.5,9.3,1.7,2,4.4,3,8.2,3s6.4-1,8.1-3c1.7-2.1,2.6-5.2,2.6-9.3s-.9-7.3-2.6-9.3c-1.7-2.1-4.4-3.1-8.1-3.1s-6.5,1-8.2,3.1c-1.7,2-2.5,5.1-2.5,9.3Z"/>
                <path fill="#EF529B" d="M83.5,36.6l15.9-12.8c1.3-1.1,2.2-2,2.7-2.9.5-.9.7-2,.7-3.2s-.5-2.8-1.5-3.7c-1-.9-2.5-1.4-4.5-1.4s-5,.8-6.3,2.5c-1.3,1.6-2,3.9-2,6.8h-5c0-3.6,1.1-6.8,3.1-9.3,2-2.6,5.4-3.9,10.2-3.9s6.7.9,8.4,2.6c1.8,1.7,2.7,3.9,2.7,6.4s-.6,3.9-1.8,5.6c-1.2,1.7-3.3,3.7-6.1,5.9l-9.5,7.5h18v3.9h-24.9v-3.9Z"/>
                <path fill="#EF529B" d="M77.6,40.5h-4.7v-18.2c0-.3,0-.6-.2-.7-.1-.2-.4-.2-.7-.2h-3.1v-4.2h3.5c1.5,0,2.8.5,3.7,1.4.9.9,1.4,2.1,1.4,3.6v18.3ZM71.2,9.4h5.9v4.2h-5.9v-4.2Z"/>
                <path fill="#EF529B" d="M62.9,40.5l-2.8-7.4h-15l-2.8,7.4h-4.9l11.5-31h7.2l11.5,31h-4.9ZM46.6,29.2h12.1l-6.1-16.4-6.1,16.4Z"/>
              </svg>
            </Box>

            {/* <Box sx={{display: 'flex', gap: '8px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 58.2 42">
                <path fill="#FAF2E9" d="M58.2,12.8c-2.1,1.3-3.5,2-5.2,3C43,21.9,33.3,28.7,25.7,37.6L22.1,42L11,24.4c2.5,2,8.7,7.5,11.2,8.7 l8.1-6.1C36,23,52,14.3,58.2,12.8z"/>
                <path fill="#FAF2E9" d="M16.2,26l0.8,0.6C14.6,20,10.6,14,5.5,9.2H0C6.4,13.7,11.9,19.4,16.2,26L16.2,26z"/>
                <path fill="#FAF2E9" d="M18,27.6l0.7,0.5c-0.3-8.3-3.4-16.7-9.3-24H4.2C11.7,11.1,16.3,19.4,18,27.6z"/>
                <path fill="#FAF2E9" d="M19.5,28.8c0.8,0.7,1.7,1.3,2.4,1.8c1.8-9.2,0.2-18.7-4.6-26.8l24.5-0.3c1.8,4,2.9,8.4,3.2,12.9 c0.7-0.4,1.4-0.7,2.1-1.1c-0.3-4.5-1.6-9.4-4-15.2H9.6C16.9,8.6,20.2,19,19.5,28.8z"/>
              </svg>

              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 62.46 42">
                <path fill="#FAF2E9" d="M45.84,0v7.58h5.32l-5.94,22.12S37.95.41,37.84,0h-7.69c-.11.4-7.98,29.7-7.98,29.7l-5.47-22.12h5.54V0H0v7.58h4.93s8.5,34.01,8.61,34.42h11.94c.11-.4,5.7-21.66,5.7-21.66,0,0,5.31,21.25,5.42,21.66h11.94c.11-.41,9.05-34.42,9.05-34.42h4.89V0h-16.62Z"/>
              </svg>
            </Box> */}
          </Box>

          <Typography variant="body2">Synthesizing millions of open sourced computer science papers. A joint project between <Link href="https://www.semanticscholar.org" target="_blank" sx={{ color: 'rgba(15, 203, 140, 1)' }}>Semantic Scholar</Link> and the <Link href="https://www.washington.edu" target="_blank" sx={{ color: 'rgba(15, 203, 140, 1)' }}>University of Washington</Link></Typography>

          <MessageBar onSend={handleSubmit} />

          <Grid
            container
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ mt: '16px', alignItems: 'center' }}
          >
            {SUGGESTIONS.map((suggestion) => (
              <Grid item key={suggestion.link}>
                <SuggestedPrompt href={suggestion.link}>
                  {suggestion.shortName}
                </SuggestedPrompt>
              </Grid>
            ))}
          </Grid>

          <div>
            {isLoading && <CircularProgress />}
          </div>
        </Box>
      </Box>
    </>
  );
};

const SuggestedPrompt = styled('a')`
  border: 1px solid ${({ theme }) => alpha(theme.color['off-white'].hex, 0.1)};
  border-radius: 6px;
  color: ${({ theme }) => theme.color.N1.hex};
  display: flex;
  font-size: ${({ theme }) => theme.font.size.md};
  gap: ${({ theme }) => theme.spacing(1)};
  line-height: ${({ theme }) => theme.spacing(3)};
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
  text-decoration: none !important;

  :hover {
    color: ${({ theme }) => theme.color.N5.hex};
  }

  & .MuiSvgIcon-root {
    color: ${({ theme }) => theme.color['green-100'].hex};
  }
`;