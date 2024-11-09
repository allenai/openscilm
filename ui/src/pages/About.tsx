import React from 'react';
import { styled } from '@mui/material';

const AboutPage = styled('div')`
    width: 100%;
    max-width: 720px;
    padding: 32px;
`;

export const About = () => {
    return (
        <AboutPage>
            <h1>About this Demo</h1>
            <p>
                This is a fresh application derived from the{' '}
                <a href="https://github.com/allenai/skiff-template">Skiff Template</a>. Skiff
                provides a <a href="https://www.python.org/">Python</a> based API and a UI
                constructed with <a href="https://www.typescriptlang.org/">TypeScript</a>,{' '}
                <a href="https://reactjs.org/">ReactJS</a>, and{' '}
                <a href="https://github.com/allenai/varnish2">Varnish</a>.
            </p>
            <p>
                It&apos;s deployed to a Google managed Kubernetes cluster and provides DNS, log
                aggregation, TLS and other capabilities out of the box, thanks to the{' '}
                <a href="https://github.com/allenai/skiff">Skiff</a> project.
            </p>
            <p>
                If you have any questions, concerns or feedback please don&apos;t hesitate to reach
                out. You can open a{' '}
                <a href="https://github.com/allenai/skiff-template/issues/new">Github Issue</a> or
                contact us at <a href="mailto:reviz@allenai.org">reviz@allenai.org</a>.
            </p>
            <p>Smooth sailing!</p>
        </AboutPage>
    );
};
