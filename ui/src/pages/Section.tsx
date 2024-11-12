import React from 'react';
import { Box } from '@mui/material';
import { useParams } from "react-router-dom";
import { Results } from '../components/Results';


export const Section = () => {

  const { taskId } = useParams();

  return (
    <Box sx={{ padding: {xs: '16px', sm: '32px'}, width: '100%' }}>
      {taskId && <Results taskId={taskId} key={taskId} />}
    </Box>
  );
};
