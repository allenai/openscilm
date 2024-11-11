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
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
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
        
        <Box sx={{padding: `8px`}}>
          <Button href="/" variant="contained" sx={{ display: 'flex', justifyContent: 'flex-start' }} startIcon={<AddIcon />} color="secondary" size="medium">
            New Question
          </Button>
        </Box>

        <Typography variant="h6" sx={{margin: '16px 8px 0 8px'}}>Recent Questions</Typography>
        <List
          sx={{
            overflow: 'auto',
            flexGrow: '1'
          }}
        >
          {sortedHistory.map((item) => {
            return (
              <ListItem key={item.taskId} disablePadding sx={{ marginBottom: '8px' }}>
                <ListItemButton
                  selected={location.pathname.includes(item.taskId)}
                  sx={{ padding: '6px 8px', borderRadius: '4px' }}
                  onClick={() => {
                    navigate(`/query/${item.taskId}`, { replace: true });
                  }}
                >
                  <Typography sx={{ fontSize: '14px' }}>{item.query}</Typography>
                </ListItemButton>
                <IconButton aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            )
          })}
        </List>

        <Box sx={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
          <Link href="https://allenai.org" target="_blank">Ai2</Link>
          <Link href="https://allenai.org/privacy-policy" target="_blank">Privacy Policy</Link>
          <Link href="https://allenai.org/terms" target="_blank">Terms of Use</Link>
        </Box>
      </Box>
    </Drawer>
  );
}