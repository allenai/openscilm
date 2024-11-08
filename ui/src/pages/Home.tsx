import React, { useCallback } from 'react';
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

  const handleSubmit = useCallback(async (query: string) => {
    console.log(query)
    setIsLoading(true);
    setIsLoading(false);

    const newStatus = await createTask(query);
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
      <OpenScholarLogo />
      <MessageBar onSend={handleSubmit} />
      <div>
          {isLoading && <CircularProgress />}
      </div>
    </>
  );
};
