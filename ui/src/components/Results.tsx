import React, { useCallback, useEffect, useState } from 'react';
import { StatusType, updateStatus } from '../api/utils';
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
  const { taskId, interval = DEFAULT_INTERVAL } = props;

  const [status, setStatus] = useState<StatusType | undefined>();

  const [progressProps, setProgressProps] = useState<Omit<ProgressPropType, 'isRunning'>>({
    estimatedTime: 'Loading...',
    startTime: -2,
    status: 'Loading...',
    httpStatus: 200
  })

  useEffect(() => {
    const timeoutIds: number[] = [];

    const inner = async () => {
      const newStatus = await updateStatus(taskId);
      console.log('setStatus', newStatus)
      setStatus(newStatus);

      if (newStatus?.httpStatus !== 200) {
        console.log('A')
        setProgressProps({
          estimatedTime: 'Error',
          startTime: -1,
          status: newStatus?.detail ?? 'Something went wrong - please try asking again',
          httpStatus: newStatus?.httpStatus ?? 500
        })
      } else {
        try {
          console.log('B')
          const startTime = parseFloat(newStatus?.task_status.split(':').at(0) ?? '0')
          const statusText = newStatus?.task_status.split(':').at(-1) ?? 'Loading...'
          setProgressProps({
            estimatedTime: newStatus?.estimated_time?.split(':')?.at(-1) ?? 'Loading...',
            startTime,
            status: statusText,
            httpStatus: newStatus?.httpStatus ?? 200
          })
        } catch (e) {
          console.error('error parsing status', e);
        }
        const taskRunning = 'task_status' in (newStatus ?? {})
        if (taskRunning) {
          const timeoutId = window.setTimeout(inner, interval);
          timeoutIds.push(timeoutId);
        }
      }
    }
    inner();
    return () => {
      timeoutIds.forEach(clearTimeout);
    }
  }, [taskId, interval]);

  const taskRunning = 'task_status' in (status ?? {})
  // const section = status?.task_result?.sections.at(-1);
  const sections = status?.task_result?.sections ?? [];
  const handleScrollToDisclaimer = useCallback(() => {
    document.querySelector('.disclaimer')?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  console.log('progressProps', progressProps)

  return (
    <>
      {(taskRunning || status?.httpStatus !== 200) && <Progress {...progressProps} isRunning={taskRunning} />}

      {sections.length > 0 && (
        <Sections sections={sections} isRunning={taskRunning}/>
      )}
    </>
  );
};
