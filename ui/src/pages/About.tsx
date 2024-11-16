import React from 'react';
import { Link, styled } from '@mui/material';

const AboutPage = styled('div')`
    width: 100%;
    max-width: 720px;
    padding: 32px;
`;

export const About = () => {
    return (
        <AboutPage>
            <Link href="https://allenai.org/blog/openscholar" target="_blank">Read more about OpenScholar</Link>
        </AboutPage>
    );
};
