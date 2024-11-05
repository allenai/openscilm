import React from 'react';
import {
    styled,
    Box,
} from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import { Header } from '@allenai/varnish2';
// import { Footer } from '@allenai/varnish2';

import { About } from './pages/About';
import { Home } from './pages/Home';
import { AppRoute } from './AppRoute';
import Sidebar from './components/Sidebar';
import { CookiesProvider } from 'react-cookie';
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

    return (
        <CookiesProvider defaultSetOptions={{ path: '/' }}>

            <DarkBackground>
                <Header style={{ zIndex: 9999 }}>
                    <Header.Columns columns="auto 1fr auto">
                        <Header.Logo label={<Header.AppName>OpenScholar</Header.AppName>}>
                        </Header.Logo>
                    </Header.Columns>
                </Header>
                <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
                    <Sidebar />
                    <Box component="main" sx={{
                        flexGrow: 1, p: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'column',
                    }}>
                        <Routes>
                            {ROUTES.map(({ path, Component }) => (
                                <Route key={path} path={path} element={<Component />} />
                            ))}
                        </Routes>
                    </Box>
                </Box>
                {/* <Footer /> */}
            </DarkBackground>
        </CookiesProvider>
    );
};
