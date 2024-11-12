import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useQueryHistory } from './shared';
import { useLocation, useNavigate } from 'react-router-dom';
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

  const handleDeleteTask = useCallback((event: React.MouseEvent, taskId: string) => {
    event.preventDefault()
    event.stopPropagation()
    if (confirm('Are you sure you want to delete this? This cannot be undone.')) {
      const newHistory = { ...history };
      try {
        delete newHistory[taskId];
        setHistory(newHistory);
        navigate('/');
      } catch (e) {
        console.error('delete task failed', e);
      }
    }
  }, [history, setHistory]);


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
            const selected = location.pathname.includes(item.taskId)
            return (
              <ListItem key={item.taskId} disablePadding sx={{ marginBottom: '8px' }}>
                <ListItemButton
                  selected={selected}
                  sx={{ padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}
                  onClick={() => {
                    navigate(`/query/${item.taskId}`, { replace: true });
                  }}
                >
                  <Typography sx={{ fontSize: '14px', fontWeight: selected ? 'bold' : 'unset' }}>{item.query}</Typography>
                  {selected && (
                    <IconButton aria-label="delete" size='small' onClick={(event) => handleDeleteTask(event, item.taskId)}>
                      <DeleteIcon fontSize='small'/>
                    </IconButton>
                  )}
                </ListItemButton>
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