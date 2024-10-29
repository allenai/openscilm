import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { useCookies } from 'react-cookie';

const drawerWidth = 240;

export default function Sidebar() {
  const [cookies, setCookie] = useCookies(['history']);
  if (!cookies.history) {
    setCookie('history', {}, { path: '/' });
  }

  const sortedHistory = Object.values(cookies.history).sort((a, b) => b.timestamp - a.timestamp)

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
        <List>
          {sortedHistory.map((item) => {
            return (
              <ListItem key={item.taskId} disablePadding>
                <ListItemButton>
                  <ListItemText primary={item.query} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
}