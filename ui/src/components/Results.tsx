import React, { useEffect } from 'react';
import { LinearProgress } from '@mui/material';
import { StatusType, updateStatus } from '../api/utils';


const DEFAULT_INTERVAL = 3000;

interface PropType {
  taskId: string;
  interval?: number;
}

export const Results: React.FC<PropType> = (props) => {
  const { taskId, interval=DEFAULT_INTERVAL } = props;

  const [status, setStatus] = React.useState<StatusType | undefined>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

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

  return (
    <div>
      {isLoading && <LinearProgress />}
      <pre>{JSON.stringify(status ?? { status: 'idle' }, undefined, 2)}</pre>
    </div>
  );
};
