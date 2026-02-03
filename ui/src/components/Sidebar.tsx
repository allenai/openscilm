import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
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
        <svg width="113px" height="36px" viewBox="0 0 756 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M93.1725 97.3271H46.5863V52.9552H84.0892C89.0964 52.9552 93.1725 48.8739 93.1725 43.8603V6.30957H137.488V52.9552C137.488 77.4661 117.652 97.3271 93.1725 97.3271ZM46.5863 101.875H0V146.247H37.5029C42.5101 146.247 46.5863 150.328 46.5863 155.341V192.892H90.9017V146.247C90.9017 121.736 71.0659 101.875 46.5863 101.875ZM195.428 99.6009C190.421 99.6009 186.345 95.5195 186.345 90.5059V52.9552H142.03V99.6009C142.03 124.112 161.865 143.973 186.345 143.973H232.931V99.6009H195.428ZM95.4434 192.892V239.538H139.759V201.987C139.759 196.974 143.835 192.892 148.842 192.892H186.345V148.52H139.759C115.279 148.52 95.4434 168.381 95.4434 192.892Z" fill="#F0529C"/>
          <path d="M533.079 37.8804H488.946V6.30961H533.079V37.869V37.8804ZM498.744 64.1761H472.119V97.3272H495.247C499.108 97.3272 502.253 100.465 502.253 104.33V239.526H537.28V101.863C537.28 77.432 521.521 64.1648 498.756 64.1648L498.744 64.1761ZM391.901 6.30961L478.42 239.538H441.644L418.663 177.635H310.503L287.522 239.538H251.098L337.617 6.30961H391.913H391.901ZM407.865 148.52L364.583 31.9119L321.301 148.52H407.854H407.865ZM619.871 210.434L690.971 154.318C732.3 121.702 750.512 98.9074 750.512 67.6891C750.512 34.6744 729.848 0 667.502 0C592.087 0 567.324 50.6815 567.324 97.3272H605.156C605.156 55.229 623.754 29.8087 667.502 29.8087C699.725 29.8087 712.691 48.5556 712.691 68.0415C712.691 85.572 707.434 97.4977 687.122 113.982L568.028 210.434V239.538H754.725V210.434H619.871Z" fill="#F0529C"/>
        </svg>
      </Box>

      {location.pathname !== '/' && (
        <Box sx={{ padding: `8px`, marginTop: '12px' }}>
          <Button href="/" variant="contained" sx={{ display: 'flex', justifyContent: 'flex-start' }} startIcon={<AddIcon />} color="secondary" size="medium">
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