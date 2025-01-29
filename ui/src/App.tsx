import MenuIcon from '@mui/icons-material/Menu';
import {
    Box,
    IconButton,
    Link,
    styled,
} from '@mui/material';
import React from 'react';
import { CookiesProvider } from 'react-cookie';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppRoute } from './AppRoute';
import Sidebar from './components/Sidebar';
import { About } from './pages/About';
import { Home } from './pages/Home';
import { Section } from './pages/Section';


/**
 * An array capturing the available routes in your application. You can
 * add or remove routes here.
 */
const ROUTES: AppRoute[] = [
    {
        path: '/',
        label: 'Home',
        Component: Home,
    },
    {
        path: '/query/:taskId',
        label: 'Results',
        Component: Section,
    },
    {
        path: '/about',
        label: 'About',
        Component: About,
    },
];

const DarkBackground = styled('div')`
    color: ${({ theme }) => theme.palette.text.reversed};
    background-color: ${({ theme }) => theme.palette.background.reversed};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`;
export const App = () => {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [isClosing, setIsClosing] = React.useState(false);

    const handleDrawerTransitionEnd = () => {
        setIsClosing(false);
    };
    const handleDrawerClose = () => {
        setIsClosing(true);
        setMobileOpen(false);
    };

    const handleDrawerToggle = () => {
        if (!isClosing) {
            setMobileOpen(!mobileOpen);
        }
    };

    return (
        <CookiesProvider defaultSetOptions={{ path: '/' }}>

            <DarkBackground>
                <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
                    <Sidebar 
                        mobileOpen={mobileOpen}
                        handleDrawerTransitionEnd={handleDrawerTransitionEnd}
                        handleDrawerClose={handleDrawerClose}
                        drawerWidth={240}
                    />
                    <Box component="main" 
                        sx={{
                            width: { xs: '100%', sm: 'calc(100% - 240px)' },
                            marginLeft: { xs: '0px', sm: '240px' },
                        }}
                    >
                        <Box sx={{ borderBottom: '1px solid rgba(250, 242, 233, 0.1)', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: { xs: '12px 16px', sm: '16px 32px' } }}>
                            <Routes>
                                {ROUTES.map(({ label, path }) => {
                                    const sidebarToggle = (
                                        <IconButton
                                            color="inherit"
                                            aria-label="open drawer"
                                            edge="start"
                                            onClick={handleDrawerToggle}
                                            sx={{ mr: 2, display: { sm: 'none' }, padding:'0', margin:'0' }}
                                        >
                                            <MenuIcon />
                                        </IconButton>
                                    )
                                    if (label === 'Home') {

                                        return (<Route key={path} path={path} element={
                                            <Box>
                                                {sidebarToggle}
                                            </Box>    
                                        } />)
                                    }
                                    return (<Route key={path} path={path} element={
                                        <Box sx={{ display: 'flex', gap: '16px' }}>
                                            {sidebarToggle}
                                            {/* <Link href="/" sx={{ height: {xs:'20px', sm:'24px'} }}>
                                                {Logo}
                                            </Link> */}
                                        </Box>
                                    } />)
                                })}
                            </Routes>
                            <Box sx={{ display: 'flex', gap: '16px' }}>
                                <Link href="/" variant="body2" sx={{ lineHeight: '24px' }}>Home</Link>
                                <Link target='_blank' href={`https://docs.google.com/forms/d/e/1FAIpQLSfqPUKxxXlV16Bs8ZGcasXMP35WKQU6eeQhYViPQ9_Cmeq5Kw/viewform?usp=pp_url&entry.268806865=${location.pathname}`} variant="body2" sx={{ lineHeight: '24px' }}>Feedback</Link>
                                <Link href="https://allenai.org/blog/openscholar" target="_blank" variant="body2" sx={{ lineHeight: '24px' }}>
                                    About
                                </Link>
                                {/* <Link href="#">Blog Post</Link> */}
                            </Box>
                        </Box>
                        <Routes>
                            {ROUTES.map(({ path, Component }) => (
                                <Route key={path} path={path} element={<Component />} />
                            ))}
                        </Routes>
                    </Box>
                </Box>
            </DarkBackground>
        </CookiesProvider>
    );
};
