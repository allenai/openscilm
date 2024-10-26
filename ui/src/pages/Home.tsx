import { Stack, styled } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { MaxWidthText } from '@allenai/varnish2';

import { Report } from '../components/report/Report';

export const Home = () => {

    return (
        <div>
            <h1>Example Demo</h1>
            <MaxWidthText as="p">
                Mock Report
            </MaxWidthText>
            <Report />
        </div>
    );
};
