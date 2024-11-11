import React, { useCallback } from 'react';
import {  
  Box,
} from '@mui/material';
import MessageBar from '../components/widgets/MessageBar';
import { useNavigate } from "react-router-dom";
import { CircularProgress } from '@mui/material';
import OpenScholarLogo from '../components/OpenScholarLogo';
import { createTask } from '../api/utils';
import { useQueryHistory } from '../components/shared';


export const Home = () => {

  const navigate = useNavigate();

  const {history, setHistory} = useQueryHistory();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleSubmit = useCallback(async (query: string, optin: boolean = false) => {
    console.log(query)
    setIsLoading(true);
    setIsLoading(false);

    const newStatus = await createTask(query, optin);
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
      <Box sx={{ alignItems:'center', display: 'flex', flexGrow: '1', flexDirection: 'column', justifyContent: 'center', padding: '32px', width: '100%', paddingTop: '240px'}}>
        <Box sx={{maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <OpenScholarLogo />
          <MessageBar onSend={handleSubmit} />      
          <div>
            {isLoading && <CircularProgress />}
          </div>
        </Box>
      </Box>
    </>
  );
};
