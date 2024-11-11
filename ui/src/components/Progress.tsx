import React from 'react';
import { Card, CardContent, CardMedia, CircularProgress, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';


import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en'
TimeAgo.addDefaultLocale(en)

import { useTimeAgo } from 'react-time-ago'



export interface ProgressPropType {
  estimatedTime: string;
  startTime: number;
  status: string;
  httpStatus: number;
  isRunning: boolean;
}

export const Progress: React.FC<ProgressPropType> = (props) => {
  
  const { estimatedTime, startTime, status, httpStatus, isRunning } = props;
  const timeAgo = useTimeAgo({ date: startTime * 1000, locale: 'en-US', updateInterval: 1, timeStyle: 'twitter' });

  return (
    <Card sx={{ width: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {status}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 0 }}>
          {startTime > 1 ? `started ${timeAgo.formattedDate} ago / estimated: ${estimatedTime}` : '---'}
        </Typography>
      </CardContent>
      <CardMedia
        component='div'
        sx={{ width: 60, minWidth: 60 }}
      >
        {isRunning ? (
          <CircularProgress />
        ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ErrorOutlineIcon color='error' fontSize='large' />
            </div>
        )}
      </CardMedia>
    </Card>
  );
};
