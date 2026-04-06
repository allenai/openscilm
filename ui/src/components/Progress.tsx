import React from 'react';
import { Card, CardContent, CardMedia, CircularProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
  const timeAgo = useTimeAgo({ date: Math.max(1, startTime) * 1000, locale: 'en-US', updateInterval: 1, timeStyle: 'twitter' });

  return (
    <Card sx={{ maxWidth: '100%', display: 'flex', alignItems: 'start', justifyContent: 'space-between', backgroundColor: (theme: any) => alpha(theme.color['off-white'].hex, 0.04) }}>
      <CardMedia
        component='div'
        sx={{ width:51, minWidth: 51, paddingTop: '16px', paddingLeft: '16px' }}
      >
        {isRunning || startTime === -2 ? (
          <CircularProgress size={35} color="secondary" />
        ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ErrorOutlineIcon color='error' fontSize='large' />
            </div>
        )}
      </CardMedia>
      <CardContent sx={{ flexGrow: 1, '&:last-child': { paddingBottom: '16px' } }}>
        <Typography variant="h5" component="div" sx={{ color: (theme: any) => theme.color['off-white'].hex }}>
          {status}
        </Typography>
        {startTime > 1 && (
          <Typography sx={{ color: (theme: any) => theme.color['off-white'].hex, mb: 0 }}>
            {`started ${timeAgo.formattedDate} ago / estimated: ${estimatedTime}`}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
