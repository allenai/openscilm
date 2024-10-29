import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useQueryHistory } from './shared';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ListSubheader } from '@mui/material';

const drawerWidth = 240;

export default function Sidebar() {
  const { history } = useQueryHistory();
  const location = useLocation();
  const navigate = useNavigate();

  const sortedHistory = Object.values(history).sort((a, b) => b.timestamp - a.timestamp)

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', paddingTop: '35px' }}>
        <Divider />
        <List
          subheader={
            <ListSubheader component="div" id="nested-list-subheader">
              Recent Queries
            </ListSubheader>
          }>
          {sortedHistory.map((item) => {
            return (
              <ListItem key={item.taskId} disablePadding>
                <ListItemButton
                  selected={location.pathname.includes(item.taskId)}
                  onClick={() => {
                    navigate(`/query/${item.taskId}`, { replace: true });
                  }}
                >
                  <ListItemText primary={item.query} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname.includes('/about')}
            onClick={() => {
              navigate(`/about`, { replace: true });
            }}
          >
            <ListItemText primary={'About OpenScholar'} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
}