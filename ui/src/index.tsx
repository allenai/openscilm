/**
 * This is the main entry point for the UI. You should not need to make any
 * changes here unless you want to update the theme.
 *
 * @see https://github.com/allenai/varnish-mui
 */
import { getTheme, getRouterOverriddenTheme, VarnishApp } from '@allenai/varnish2';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { App } from './App';
import { ScrollToTopOnPageChange } from './components/shared';

const VarnishedApp = () => {
    const theme = getTheme(getRouterOverriddenTheme(HashLink));

    return (
        <BrowserRouter>
            <ScrollToTopOnPageChange />
            <VarnishApp theme={theme}>
                <App />
            </VarnishApp>
        </BrowserRouter>
    );
};

const container = document.getElementById('root');
if (!container) {
    throw new Error("No element with an id of 'root' was found.");
}
const root = createRoot(container);
root.render(<VarnishedApp />);
