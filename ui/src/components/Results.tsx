import React, { useCallback, useEffect } from 'react';
import { Box, Button, ButtonGroup, LinearProgress } from '@mui/material';
import { StatusType, updateStatus } from '../api/utils';
import { Report } from './report/Report';
import { useQueryHistory } from './shared';
import { useNavigate } from 'react-router-dom';


const DEFAULT_INTERVAL = 3000;

interface PropType {
  taskId: string;
  interval?: number;
}

export const Results: React.FC<PropType> = (props) => {
  const { taskId, interval=DEFAULT_INTERVAL } = props;
  const { history, setHistory } = useQueryHistory();
  const navigate = useNavigate();

  const [status, setStatus] = React.useState<StatusType | undefined>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleDeleteTask = useCallback(() => {
    if (confirm('Are you sure you want to delete this answer?')) {
      const newHistory = { ...history };
      try {
      delete newHistory[taskId];
      setHistory(newHistory);
      navigate('/');
      } catch (e) {
        console.error('delete task failed', e);
      }
    }
  }, [taskId, history, setHistory]);

  useEffect(() => {
    const timeoutIds: number[] = [];
    const inner = async () => {
      setIsLoading(true);
      const newStatus = await updateStatus(taskId);
      setIsLoading(false);
      setStatus(newStatus);
      if (!newStatus.task_result) {
        const timeoutId = window.setTimeout(inner, interval);
        timeoutIds.push(timeoutId);
      }
    }
    inner();
    return () => {
      timeoutIds.forEach(clearTimeout);
    }
  }, [taskId, interval, setIsLoading]);

  const section = status?.task_result?.sections.at(-1);

  return (
    <div>
      {isLoading && <LinearProgress style={{ marginBottom: '-4px' }} />}
      <h2>{status?.query}</h2>
      {section && (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              justifyContent: 'space-between',
              marginBottom: '6px',
              '& > *': {
                m: 0,
              },
            }}
          >
            <ButtonGroup size="small" aria-label="Small button group" style={{marginRight: '12px'}}>
              <Button key="one">Good</Button>
              <Button key="two">Bad</Button>
            </ButtonGroup>
            <Button key="three" onClick={handleDeleteTask}>Delete</Button>
          </Box>
          <Report section={section} />
        </>
      )}
      {!section && (
        <>
            <Button key="three" onClick={handleDeleteTask}>Delete This Task</Button>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(status ?? { status: 'idle' }, undefined, 2)}</pre>
        </>
      )}
    </div>
  );
};
