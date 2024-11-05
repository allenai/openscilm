import React, { useCallback, useEffect } from 'react';
import { Box, Button, ButtonGroup, LinearProgress } from '@mui/material';
import { StatusType, updateStatus } from '../api/utils';
import { Report } from './report/Report';
import { useQueryHistory } from './shared';
import { useNavigate } from 'react-router-dom';
import { Progress, ProgressPropType } from './Progress';
import { Sections } from './Sections';


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
  const [_isLoading, setIsLoading] = React.useState<boolean>(false);

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
      console.log('setStatus', newStatus)
      setStatus(newStatus);
      const taskRunning = !newStatus || 'task_status' in newStatus
      if (taskRunning && newStatus.httpStatus !== 404) {
        const timeoutId = window.setTimeout(inner, interval);
        timeoutIds.push(timeoutId);
      }
    }
    inner();
    return () => {
      timeoutIds.forEach(clearTimeout);
    }
  }, [taskId, interval, setIsLoading]);

  // const section = status?.task_result?.sections.at(-1);
  const sections = status?.task_result?.sections ?? [];
    let progressProps: ProgressPropType = {
      estimatedTime: 'Loading...',
      startTime: -1,
      status: 'Loading...',
      httpStatus: 200
    }
  // if (!status?.task_result) {
  const taskRunning = !status || 'task_status' in status
  if (taskRunning) {
    if (status?.httpStatus === 404) {
        progressProps = {
          estimatedTime: '---',
          startTime: -1,
          status: 'Answer not found - please try asking again',
          httpStatus: status.httpStatus
        }
    } else {
      try {
        const startTime = parseFloat(status?.task_status.split(':').at(0) ?? '0')
        const statusText = status?.task_status.split(':').at(-1) ?? 'Loading...'
        progressProps = {
          estimatedTime: status?.estimated_time?.split(':')?.at(-1) ?? 'Loading...',
          startTime,
          status: statusText,
          httpStatus: status?.httpStatus ?? 200
        }
      } catch (e) {
        console.error('error parsing status', e);
      }

    }
  }

  return (
    <div>
      {/* {isLoading && <LinearProgress style={{ marginBottom: '-4px' }} />} */}
      <div style={{display: 'flex', justifyContent: 
      'space-between', alignItems: 'baseline'}}>
        <h3 style={{ flexGrow: 1 }}>{status?.query ?? '---'}</h3>
        <Button key="three" onClick={handleDeleteTask} style={{flex: '0 0 150px'}}>Remove from history</Button>
      </div>
      {taskRunning && (
        <>
            <Button key="three" onClick={handleDeleteTask}>Abort This Task</Button>
            <Progress {...progressProps} />
        </>
      )}
      {sections.length > 0 && (
        <>
          {/* <Box
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
            {!(taskRunning) && (
              <>
                <ButtonGroup size="small" aria-label="Small button group" style={{ marginRight: '12px' }}>
                  <Button key="one">Good</Button>
                  <Button key="two">Bad</Button>
                </ButtonGroup>
                <Button key="three" onClick={handleDeleteTask}>Remove from history</Button>
              </>
            )}
          </Box> */}
          
          <Sections sections={sections} />
        </>
      )}
    </div>
  );
};
