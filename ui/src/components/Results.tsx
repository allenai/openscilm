import React, { useEffect } from 'react';
import { LinearProgress } from '@mui/material';
import { convertIterationToSection, StatusType, updateStatus } from '../api/utils';
import { Report } from './report/Report';


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

  const section = convertIterationToSection(status?.task_result?.iterations.at(-1) ?? { text: '', citations: [] });

  return (
    <div>
      {isLoading && <LinearProgress style={{ marginBottom: '-4px' }} />}
      <h2>{status?.query}</h2>
      {status?.task_result && (
        <Report section={section}/>
      )}
      {!status?.task_result && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(status ?? { status: 'idle' }, undefined, 2)}</pre>
      )}
    </div>
  );
};
