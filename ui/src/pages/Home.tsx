import React, { useCallback, useEffect } from 'react';
import { Report } from '../components/report/Report';
import MessageBar from '../components/widgets/MessageBar';
import { useNavigate, useParams } from "react-router-dom";

interface StatusType {
  task_id: string;
}

export const Home = () => {

    const navigate = useNavigate();
    const { taskId } = useParams();
    const [status, setStatus] = React.useState<StatusType|undefined>();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const handleSubmit = useCallback(async (query: string) => {
        console.log(query)
        setIsLoading(true);
        const response = await fetch('/api/query_open_scholar', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              feedback_toggle: true
            })
          });
          setIsLoading(false);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const newStatus = (await response.json()) as unknown as StatusType;
          console.log(newStatus, newStatus.task_id);
          if (newStatus.task_id) {
            navigate(`/query/${newStatus.task_id}`, { replace: true });
          }

          setStatus(newStatus);
    }, []);

    useEffect(() => {
        if (taskId) {
          console.log('Task Id Changed!', taskId)
        }
    }, [taskId]);

    return (
        <div>
            <div style={{ padding: '24px 10px' }}>
                <MessageBar onSend={handleSubmit} />
            </div>
            <pre>{JSON.stringify(status ?? {status: 'idle'}, undefined, 2)}</pre>
            <Report />
        </div>
    );
};
