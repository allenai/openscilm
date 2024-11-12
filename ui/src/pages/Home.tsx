import React, { useCallback } from 'react';
import MessageBar from '../components/widgets/MessageBar';
import { useNavigate } from "react-router-dom";
import { CircularProgress } from '@mui/material';
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
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
      <div style={{ width: '100%', maxWidth: '860px' }}>
        <div style={{ padding: '24px 10px' }}>
          <MessageBar onSend={handleSubmit} />
        </div>
        {isLoading && <CircularProgress />}
      </div>
    </div>
  );
};
