import {
  alpha,
  Box,
  Grid,
  Link,
  styled,
  Typography
} from '@mui/material';
import { lighten } from '@mui/material/styles';
import React, { useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import MessageBar from '../components/widgets/MessageBar';

import { createTask } from '../api/utils';
import { useQueryHistory } from '../components/shared';
import { AstaBanner } from '../components/AstaBanner';

const SUGGESTIONS: { link: string, shortName: string }[] = [
  // {link: 'https://openscilm.allen.ai/query/303bed4a-3988-42a4-a60f-d321a698b66e', shortName: 'Compare two papers'},
  // {link: 'https://openscilm.allen.ai/query/9cc9b2f9-52d4-4660-9845-4e1272d178a4', shortName: 'SWE-bench leaderboard'},
  // {link: 'https://openscilm.allen.ai/query/28cd2f86-22fa-4168-9220-340daf0c8ec6', shortName: 'Scaling retrieval-augmented LMs'}
  { link: 'https://openscilm.allen.ai/query/96c8419a-d0df-4354-ae5b-63c2e4e454b0', shortName: 'Find papers on a topic' },
  { link: 'https://openscilm.allen.ai/query/e5e6d46f-fe65-4674-bbab-4c9ee8bcef58', shortName: 'Learn about a concept' },
  { link: 'https://openscilm.allen.ai/query/803b9e79-9266-4ca0-ae20-9f629379c6ae', shortName: 'Summarize a paper' },
  { link: 'https://openscilm.allen.ai/query/211ea55e-a086-431c-ac1c-2c6047a5bca2', shortName: 'Study an algorithm' },
  { link: 'https://openscilm.allen.ai/query/28cd2f86-22fa-4168-9220-340daf0c8ec6', shortName: 'Check for prior work' }
]

export const Home = () => {

  const navigate = useNavigate();

  const {history, setHistory} = useQueryHistory();

  const handleSubmit = useCallback(async (query: string, userId: string, optin: boolean = false) => {
    console.log(query)

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
      <Box sx={{ alignItems:'center', display: 'flex', flexGrow: '1', flexDirection: 'column', justifyContent: 'center', padding: {xs: '60px 16px 16px 16px', sm: '160px 32px 32px 32px'}, width: '100%'}}>
        <Box sx={{maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px'}}>
          <Box sx={{display: 'flex', flexDirection: 'column', gap:'4px'}}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"PP Telegraf", "Manrope", sans-serif',
                color: (theme) => theme.color['green-100'].hex,
                fontSize: {
                  xs: '26px',
                  sm: '36px'
                },
                fontWeight: 'bold',
                mb: 1  // margin bottom
              }}
            >
              Can language models synthesize scientific literature?
            </Typography>
            <Typography variant="body1">
              In a joint project between <Link
                href="https://allenai.org"
                target="_blank"
                sx={{
                  color: (theme) => theme.color['green-100'].hex,
                  transition: 'color 250ms ease-out',
                  '&:hover': {
                    color: (theme) => lighten(theme.color['green-100'].hex, 0.4)
                  }
                }}
              >
                Ai2
              </Link> and the <Link
                href="https://www.washington.edu"
                target="_blank"
                sx={{
                  color: (theme) => theme.color['green-100'].hex,
                  transition: 'color 250ms ease-out',
                  '&:hover': {
                    color: (theme) => lighten(theme.color['green-100'].hex, 0.4)
                  }
                }}
              >
                University of Washington
              </Link>,
              we train and release a fully open, retrieval-augmented language model that can synthesize 108M+ abstracts and 12M+ full-text papers to answer scientific questions.
            </Typography>
            <Typography variant="body1" component="div">
            <ul className="list-disc pl-4">
              <li>
                Download the <Link
                  href="https://huggingface.co/OpenSciLM"
                  target="_blank"
                  sx={{
                    color: (theme) => theme.color['green-100'].hex,
                    transition: 'color 250ms ease-out',
                    '&:hover': {
                      color: (theme) => lighten(theme.color['green-100'].hex, 0.4)
                    }
                  }}
                >
                  full collection
                </Link>---including model weights, training data and retrieval index.
              </li>
              <li>
                To learn more about the project, check out <Link
                  href="https://arxiv.org/abs/2411.14199"
                  target="_blank"
                  sx={{
                    color: (theme) => theme.color['green-100'].hex,
                    transition: 'color 250ms ease-out',
                    '&:hover': {
                      color: (theme) => lighten(theme.color['green-100'].hex, 0.4)
                    }
                  }}
                >
                  our paper
                </Link>.
              </li>
            </ul>
          </Typography>
          </Box>
          
          <Box sx={{display: 'flex', flexDirection: 'column', gap:'8px'}}>
            <MessageBar onSend={handleSubmit} />
            <Typography
              component="h3"
              sx={{
                fontFamily: '"PP Telegraf", "Manrope", sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                color: (theme) => theme.color['green-100'].hex,
                mt: 2
              }}
            >
              Try one of these suggestions
            </Typography>
            <Grid
              container
              spacing={1}
            >
              {SUGGESTIONS.map((suggestion) => (
                <Grid item key={suggestion.link}>
                  <SuggestedPrompt href={suggestion.link}>
                    {suggestion.shortName}
                  </SuggestedPrompt>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>

      <AstaBanner />
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
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
  text-decoration: none !important;
  transition: color 250ms ease-out, border-color 250ms ease-out;

  :hover {
    color: ${({ theme }) => lighten(theme.color['green-100'].hex, 0.4)};
    border-color: ${({ theme }) => alpha(theme.color['off-white'].hex, 0.4)};
  }

  & .MuiSvgIcon-root {
    color: ${({ theme }) => theme.color['green-100'].hex};
  }
`;