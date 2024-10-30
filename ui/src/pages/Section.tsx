import React from 'react';
import { useParams } from "react-router-dom";
import { Results } from '../components/Results';


export const Section = () => {

  const { taskId } = useParams();

  return (
    <div style={{ maxWidth: '1200px' }}>
      {taskId && <Results taskId={taskId} key={taskId} />}
    </div>
  );
};
