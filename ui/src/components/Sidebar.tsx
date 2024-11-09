import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Link from '@mui/material/Link';
import { useQueryHistory } from './shared';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ListSubheader } from '@mui/material';
import { useCallback } from 'react';

const drawerWidth = 240;

export default function Sidebar() {
  const { history, setHistory } = useQueryHistory();
  const location = useLocation();
  const navigate = useNavigate();

  const sortedHistory = Object.values(history).sort((a, b) => b.timestamp - a.timestamp)

  const handleDeleteAllTasks = useCallback(() => {
    if (confirm('Are you sure you want to delete ALL answers? This cannot be undone.')) {
      try {
        setHistory({});
        navigate('/');
      } catch (e) {
        console.error('delete all tasks had failed', e);
      }
    }
  }, [setHistory]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{display: 'flex', flexDirection: 'column', height:'100%', padding: '8px'}}>
        
        <Button href="/" variant="contained" sx={{ display: 'flex' }} startIcon={<AddIcon />} color="secondary" size="medium">
          New Question
        </Button>

        <List
          subheader={
            <ListSubheader component="div" id="nested-list-subheader">
              Recent Questions
            </ListSubheader>
          }
          sx={{
            overflow: `auto`,
            flexGrow: `1`
          }}
        >
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

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Link href="https://allenai.org" target="_blank">Ai2</Link>
          <Link href="https://allenai.org/privacy-policy" target="_blank">Privacy Policy</Link>
          <Link href="https://allenai.org/terms" target="_blank">Terms of Use</Link>
        </Box>
      </Box>
    </Drawer>
  );
}