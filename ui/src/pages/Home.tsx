import React from 'react';
import { MaxWidthText } from '@allenai/varnish2';

import { Report } from '../components/report/Report';
import MessageBar from '../components/widgets/MessageBar';

export const Home = () => {

    return (
        <div>
            <div style={{ padding: '24px 10px' }}>
                <MessageBar onSend={(text) => console.log(text)} />
            </div>
            <Report />
        </div>
    );
};
