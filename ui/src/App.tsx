/**
 * This is the top-level component that defines your UI application.
 *
 * This is an appropriate spot for application wide components and configuration,
 * stuff like application chrome (headers, footers, navigation, etc), routing
 * (what urls go where), etc.
 *
 * @see https://github.com/reactjs/react-router-tutorial/tree/master/lessons
 */

import React from 'react';
import { useState } from 'react';
import {
    styled,
    Box,
    List,
    IconButton,
    Drawer,
    ListItem,
    ListItemButton,
    useMediaQuery,
    useTheme,
    Stack,
} from '@mui/material';
import { Route, Link, Routes, useLocation } from 'react-router-dom';
import { Header, Content, Footer } from '@allenai/varnish2';
import MenuIcon from '@mui/icons-material/Menu';

import { About } from './pages/About';
import { Home } from './pages/Home';
import { AppRoute } from './AppRoute';

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
        path: '/about',
        label: 'About',
        Component: About,
    },
];

export const App = () => {
    // Used to query the current page the user is on
    const location = useLocation();

    const theme = useTheme();
    const greaterThanMd = useMediaQuery(theme.breakpoints.up('md'));

    // Used to open and close the menu
    const [menuOpen, setMenuOpen] = useState(false);
    const handleMenuToggle = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <div>
            <Header>
                <Header.Columns columns="auto 1fr auto">
                    <Header.Logo label={<Header.AppName>Skiff</Header.AppName>}>
                        <SimpleLogo>
                            <span role="img" aria-label="Skiff Logo">
                                {
                                    ['⛵️', '⚓️', '🐠', '🛶', '🐟', '🐙', '🐡'][
                                        Math.floor(Math.random() * 7)
                                    ]
                                }
                            </span>
                        </SimpleLogo>
                    </Header.Logo>
                    <span />
                    <Header.MenuColumn>
                        {greaterThanMd ? (
                            <Stack direction="row">
                                {ROUTES.map(({ path, label }) => (
                                    <Link key={path} to={path}>
                                        <MenuButton selected={location.pathname === path}>
                                            {label}
                                        </MenuButton>
                                    </Link>
                                ))}
                            </Stack>
                        ) : (
                            <>
                                {ROUTES.length > 1 ? (
                                    <Box component="nav">
                                        <IconButton edge="end" onClick={handleMenuToggle}>
                                            <MenuIcon />
                                        </IconButton>
                                        <Drawer
                                            variant="temporary"
                                            anchor="right"
                                            open={menuOpen}
                                            onClose={handleMenuToggle}
                                            ModalProps={{
                                                keepMounted: true, // Better open performance on mobile
                                            }}>
                                            <Menu>
                                                {ROUTES.map(({ path, label }) => (
                                                    <ListItem key={path} disablePadding>
                                                        <Link to={path} onClick={handleMenuToggle}>
                                                            <MenuButton
                                                                selected={
                                                                    location.pathname === path
                                                                }>
                                                                {label}
                                                            </MenuButton>
                                                        </Link>
                                                    </ListItem>
                                                ))}
                                            </Menu>
                                        </Drawer>
                                    </Box>
                                ) : null}
                            </>
                        )}
                    </Header.MenuColumn>
                </Header.Columns>
            </Header>

            <Content main>
                <Routes>
                    {ROUTES.map(({ path, Component }) => (
                        <Route key={path} path={path} element={<Component />} />
                    ))}
                </Routes>
            </Content>
            <Footer />
        </div>
    );
};

const Menu = styled(List)`
    && {
        margin-top: ${({ theme }) => theme.spacing(3)};
    }
`;

const MenuButton = styled(ListItemButton)`
    ${({ theme }) => theme.breakpoints.up('md')} {
        max-height: 60px;
    }
    ${({ theme }) => theme.breakpoints.down('md')} {
        && {
            min-width: 180px;
            max-width: 240px;
        }
    }
`;

const SimpleLogo = styled('div')`
    border-radius: 25px;
    width: 53px;
    height: 53px;
    line-height: 1;
    font-size: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: ${({ theme }) => theme.color.B2.toString()};
`;
