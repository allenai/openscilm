import React, { useCallback, useEffect } from 'react';
import MessageBar from '../components/widgets/MessageBar';
import { useNavigate, useParams } from "react-router-dom";
import { CircularProgress } from '@mui/material';
import { Results } from '../components/Results';
import { createTask } from '../api/utils';
import { useCookies } from 'react-cookie';


export const Home = () => {

  const navigate = useNavigate();
  const { taskId } = useParams();

  const [cookies, setCookie] = useCookies(['history']);
  if (!cookies.history) {
    setCookie('history', {}, { path: '/' });
  }

  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleSubmit = useCallback(async (query: string) => {
    console.log(query)
    setIsLoading(true);
    setIsLoading(false);

    const newStatus = await createTask(query);
    console.log(newStatus, newStatus.task_id);
    if (newStatus.task_id) {
      navigate(`/query/${newStatus.task_id}`, { replace: true });
      if (!cookies.history[newStatus.task_id]) {
        setCookie('history', { ...cookies.history, [newStatus.task_id]: {
          query, taskId: newStatus.task_id, timestamp: Date.now()
        }}, { path: '/' });
      }
    }
  }, []);

  return (
    <div style={{ paddingLeft: '25px' }}>
      <div style={{ padding: '24px 10px' }}>
        <MessageBar onSend={handleSubmit} />
      </div>
      {isLoading && <CircularProgress />}
      {taskId && <Results taskId={taskId} key={taskId} />}
    </div>
  );
};
