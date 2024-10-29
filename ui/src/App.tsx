import React from 'react';
import {
    styled,
    List,
    ListItemButton,
    Box,
} from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import { Header, Content, Footer } from '@allenai/varnish2';

import { About } from './pages/About';
import { Home } from './pages/Home';
import { AppRoute } from './AppRoute';
import Sidebar from './components/Sidebar';

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
        label: 'Home',
        Component: Home,
    },
    {
        path: '/about',
        label: 'About',
        Component: About,
    },
];


const DarkBackground= styled('div')`
    color: ${({ theme }) => theme.palette.text.reversed};
    background-color: ${({ theme }) => theme.palette.background.reversed};
`;

export const App = () => {

    return (
        <DarkBackground>
            <Header style={{ zIndex: 9999 }}>
                <Header.Columns columns="auto 1fr auto">
                    <Header.Logo label={<Header.AppName>OpenScholar</Header.AppName>}>
                    </Header.Logo>
                </Header.Columns>
            </Header>
            <Box sx={{ display: 'flex' }}>
                <Sidebar />
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Routes>
                        {ROUTES.map(({ path, Component }) => (
                            <Route key={path} path={path} element={<Component />} />
                        ))}
                    </Routes>
                </Box>
            </Box>
            <Footer />
        </DarkBackground>
    );
};
