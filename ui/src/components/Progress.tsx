import React from 'react';
import { Card, CardContent, CardMedia, CircularProgress, Typography } from '@mui/material';
import { useElapsedTime } from 'use-elapsed-time';


export interface ProgressPropType {
  estimatedTime: string;
  startTime: number;
  status: string;
}

export const Progress: React.FC<ProgressPropType> = (props) => {
  const { estimatedTime, startTime, status } = props;

  const { elapsedTime } = useElapsedTime({ isPlaying: true, startAt: startTime * 1000 })

  const min = Math.floor(elapsedTime / 60);
  const sec = Math.round(elapsedTime - (min * 60));

  return (
    <Card sx={{ width: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {status}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 0 }}>
          Running for: {`${min} mins ${sec} seconds`} /
          Estimated: {estimatedTime}
        </Typography>
      </CardContent>
      <CardMedia
        component='div'
        sx={{ width: 50 }}
      >
        <CircularProgress />
      </CardMedia>
    </Card>
  );
};
