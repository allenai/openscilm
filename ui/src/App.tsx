import React from 'react';
import {
    styled,
    Box,
    Link,
} from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import { About } from './pages/About';
import { Home } from './pages/Home';
import { AppRoute } from './AppRoute';
import Sidebar from './components/Sidebar';
import { CookiesProvider } from 'react-cookie';
import { Section } from './pages/Section';
import Logo from './components/assets/logo';


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

const AppHeader = styled('div')`
    border-bottom: 1px solid rgba(250, 242, 233, 0.1);
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px;
`;
export const App = () => {

    return (
        <CookiesProvider defaultSetOptions={{ path: '/' }}>

            <DarkBackground>
                <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
                    <Sidebar />
                    <Box component="main" sx={{ width: `100%` }}>
                        <AppHeader>
                            <Routes>
                                {ROUTES.map(({ label, path }) => {
                                    if (label === 'Home') {
                                        return <Route key={path} path={path} element={<span></span>} />
                                    }
                                    return (<Route key={path} path={path} element={
                                        <Link href="/" sx={{ height: '24px' }}>
                                            {Logo}
                                        </Link>
                                    } />)
                                })}
                            </Routes>
                            <Box sx={{ display: 'flex', gap: '16px' }}>
                                <Link href="/about">About OpenScholar</Link>
                                {/* <Link href="#">Blog Post</Link> */}
                            </Box>
                        </AppHeader>
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
