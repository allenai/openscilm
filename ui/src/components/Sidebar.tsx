import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddBoxOutlined from '@mui/icons-material/AddBoxOutlined';
import Drawer from '@mui/material/Drawer';
import DeleteIcon from '@mui/icons-material/Delete';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { alpha, lighten } from '@mui/material/styles';
import { useQueryHistory } from './shared';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { IconButton } from '@mui/material';
import { DisclaimerModal } from './DisclaimerModal';
import { AttributionModal } from './AttributionModal';
import { Ai2Logo } from './logos/Ai2Logo';

interface PropType {
  mobileOpen: boolean;
  handleDrawerTransitionEnd: () => void;
  handleDrawerClose: () => void;
  drawerWidth: number;
}

export const Sidebar: React.FC<PropType> = (props) => {
  const { mobileOpen, handleDrawerTransitionEnd, handleDrawerClose, drawerWidth } = props;
  const { history, setHistory } = useQueryHistory();
  const location = useLocation();
  const navigate = useNavigate();
  console.log('sidebar history', history)

  const [disclaimerOpen, setDisclaimerOpen] = React.useState(false);
  const handleDisclaimerOpen = useCallback(() => setDisclaimerOpen(true), []);
  const handleDisclaimerClose = useCallback(() => setDisclaimerOpen(false), []);

  const [attributionOpen, setAttributionOpen] = React.useState(false);
  const handleAttributionOpen = useCallback(() => setAttributionOpen(true), []);
  const handleAttributionClose = useCallback(() => setAttributionOpen(false), []);

  const sortedHistory = Object.values(history).sort((a, b) => b.timestamp - a.timestamp)

  const handleDeleteTask = useCallback((event: React.MouseEvent, taskId: string) => {
    event.preventDefault()
    event.stopPropagation()
    if (confirm('Are you sure you want to delete this? This cannot be undone.')) {
      const newHistory = { ...history };
      navigate('/');
      try {
        delete newHistory[taskId];
        console.log('deleted history', newHistory)
        setHistory(newHistory);
        navigate('/');
      } catch (e) {
        console.error('delete task failed', e);
      }
    }
  }, [history, setHistory, navigate]);

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: {xs:'90vh', sm:'100%'}, padding: '8px', color: (theme) => theme.color['off-white'].hex }}>

      <Box sx={{ padding: '8px', display: 'flex', justifyContent: 'flex-start' }}>
        <Link href="/" sx={{ display: 'flex', textDecoration: 'none' }}>
          <Ai2Logo fill="#F0529C" />
        </Link>
      </Box>

      {location.pathname !== '/' && (
        <Box sx={{ padding: `8px`, marginTop: '12px' }}>
          <Button href="/" variant="contained" sx={{ display: 'flex', justifyContent: 'flex-start', backgroundColor: (theme: any) => alpha(theme.color['off-white'].hex, 0.04), border: (theme: any) => `1px solid ${alpha(theme.color['off-white'].hex, 0.1)}`, color: (theme: any) => theme.color['off-white'].hex, '&:hover': { color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4), borderColor: (theme: any) => alpha(theme.color['off-white'].hex, 0.4), backgroundColor: (theme: any) => alpha(theme.color['off-white'].hex, 0.08) } }} startIcon={<AddBoxOutlined />} size="medium">
            New Question
          </Button>
        </Box>
      )}

      {sortedHistory.length > 0 && (
        <Typography variant="h6" sx={{ margin: '16px 8px 0 8px', fontFamily: '"PP Telegraf", "Manrope", sans-serif', fontSize: '18px', fontWeight: 700, color: (theme) => theme.color['green-100'].hex }}>Recent Questions</Typography>
      )}
      <List
        sx={{
          overflow: 'auto',
          flexGrow: '1'
        }}
      >
        {sortedHistory.map((item) => {
          const selected = location.pathname.includes(item.taskId)
          return (
            <ListItem key={item.taskId} disablePadding>
              <ListItemButton
                selected={selected}
                sx={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '4px',
                  '&.Mui-selected': {
                    backgroundColor: (theme) => alpha(theme.color['off-white'].hex, 0.04)
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: (theme) => alpha(theme.color['off-white'].hex, 0.1)
                  }
                }}
                onClick={() => {
                  navigate(`/query/${item.taskId}`, { replace: true });
                }}
              >
                <Typography sx={{
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: `36px`,
                  fontWeight: selected ? 'bold' : 'unset',
                  transition: 'color 250ms ease-out',
                  '.MuiListItemButton-root:hover &': {
                    color: (theme) => lighten(theme.color['green-100'].hex, 0.6)
                  }
                }}>{item.query}</Typography>
                {selected && (
                  <IconButton
                    aria-label='delete'
                    size='small'
                    onClick={(event) => handleDeleteTask(event, item.taskId)}
                    sx={{
                      padding: '4px',
                      color: (theme) => theme.color['off-white'].hex,
                      opacity: 0.5,
                      transition: 'color 250ms ease-out, opacity 250ms ease-out',
                      '&:hover': {
                        color: (theme) => lighten(theme.color['green-100'].hex, 0.6),
                        opacity: 1
                      }
                    }}
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Box sx={{ padding: '8px', display: 'flex', flexDirection: 'column' }}>
        <Box>
          <Link
            onClick={handleDisclaimerOpen}
            variant="body2"
            sx={{
              color: (theme: any) => alpha(theme.color['off-white'].hex, 0.8),
              transition: 'color 250ms ease-out',
              cursor: 'pointer',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}
          >
            Disclaimer
          </Link>&nbsp;&nbsp;•&nbsp;&nbsp;<Link
            onClick={handleAttributionOpen}
            variant="body2"
            sx={{
              color: (theme: any) => alpha(theme.color['off-white'].hex, 0.8),
              transition: 'color 250ms ease-out',
              cursor: 'pointer',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}
          >
            Attribution
          </Link>
        </Box>
        <Box>
          <Link
            href="https://allenai.org/privacy-policy"
            target="_blank"
            variant="body2"
            sx={{
              color: (theme: any) => alpha(theme.color['off-white'].hex, 0.8),
              transition: 'color 250ms ease-out',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}
          >
            Privacy Policy
          </Link>&nbsp;&nbsp;•&nbsp;&nbsp;<Link
            href="https://allenai.org/terms"
            target="_blank"
            variant="body2"
            sx={{
              color: (theme: any) => alpha(theme.color['off-white'].hex, 0.8),
              transition: 'color 250ms ease-out',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}
          >
            Terms of Use
          </Link>
        </Box>
        <Box>
          <Link
            href="https://allenai.org/responsible-use"
            target="_blank"
            variant="body2"
            sx={{
              color: (theme: any) => alpha(theme.color['off-white'].hex, 0.8),
              transition: 'color 250ms ease-out',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.4)
              }
            }}
          >
            Responsible Use
          </Link>
        </Box>
      </Box>

      <DisclaimerModal open={disclaimerOpen} onClose={handleDisclaimerClose} />
      <AttributionModal open={attributionOpen} onClose={handleAttributionClose} />
    </Box>

  )


  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={handleDrawerTransitionEnd}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          flexShrink: 0,
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: {xs: '80vw', sm: '240px'},
            backgroundColor: 'rgba(10, 50, 53, 1)',
            border: 'none'
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: {xs: '80vw', sm: '240px'},
            backgroundColor: (theme) => alpha(theme.color['off-white'].hex, 0.04),
            border: 'none'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
}
export default Sidebar;