import React from 'react';
import { Card, CardContent, CardMedia, CircularProgress, Typography } from '@mui/material';

import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en'
TimeAgo.addDefaultLocale(en)

import { useTimeAgo } from 'react-time-ago'



export interface ProgressPropType {
  estimatedTime: string;
  startTime: number;
  status: string;
}

export const Progress: React.FC<ProgressPropType> = (props) => {
  const { estimatedTime, startTime, status } = props;

  const timeAgo = useTimeAgo({ date: startTime * 1000, locale: 'en-US', updateInterval: 1, timeStyle: 'twitter' });

  return (
    <Card sx={{ width: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {status}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 0 }}>
          {startTime > 1 ? `started ${timeAgo.formattedDate} ago / estimated: ${estimatedTime}` : 'Loading...'}
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
