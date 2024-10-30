import React, { useCallback, useEffect } from 'react';
import { Box, Button, ButtonGroup, LinearProgress } from '@mui/material';
import { StatusType, updateStatus } from '../api/utils';
import { Report } from './report/Report';
import { useQueryHistory } from './shared';
import { useNavigate } from 'react-router-dom';
import { Progress, ProgressPropType } from './Progress';


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
    if (confirm('Are you sure you want to delete this? This cannot be undone.')) {
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
    let progressProps: ProgressPropType = {
      estimatedTime: 'Loading...',
      startTime: -1,
      status: 'Loading...'
    }
  if (!status?.task_result) {
    try {
      const startTime = parseFloat(status?.task_status.split(':').at(0) ?? '0')
      const statusText = status?.task_status.split(':').at(-1) ?? 'Loading...'
      progressProps = {
        estimatedTime: status?.estimated_time?.split(':')?.at(-1) ?? 'Loading...',
        startTime,
        status: statusText
      }
    } catch (e) {
      console.error('error parsing status', e);
    }
  }

  return (
    <div>
      {/* {isLoading && <LinearProgress style={{ marginBottom: '-4px' }} />} */}
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
            <Button key="three" onClick={handleDeleteTask}>Abort This Task</Button>
            <Progress {...progressProps} />
        </>
      )}
    </div>
  );
};
