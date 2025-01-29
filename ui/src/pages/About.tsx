import { Link, styled } from '@mui/material';
import React from 'react';

const AboutPage = styled('div')`
    width: 100%;
    max-width: 720px;
    padding: 32px;
`;

export const About = () => {
    return (
        <AboutPage>
            <Link href="https://allenai.org/blog/openscilm" target="_blank">Read more about our project</Link>
        </AboutPage>
    );
};
