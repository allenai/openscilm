import React from 'react';
import { Divider, Typography } from '@mui/material';
import styled from 'styled-components';

import { EvidenceCardProps } from './EvidenceCard';
import { Evidence } from './utils';

export const EvidenceCardContent = (
  props: EvidenceCardProps,
): React.ReactNode => {
  const [evidences, setEvidences] = React.useState<Evidence[] | null>(null);

  React.useEffect(() => {
    // If evidence data is provided, use it directly
    console.log('PROPS', props);
    if ('evidences' in props) {
      setEvidences(props.evidences);
      return;
    }
  }, [props]);

  if (!evidences) {
    return null;
  }

  return (
    <>
      {evidences.map((evidence, index) => (
        <EvidenceContainer key={index}>
          <Divider />
          <Typography sx={{ mb: 1.5 }} variant="body2">
            {`“${evidence.text}”`}
          </Typography>
        </EvidenceContainer>
      ))}
    </>
  );
};

const ButtonContainer = styled.div`
  width: 100%;
  margin-bottom: 10px;
  text-align: right;
`;

const EvidenceContainer = styled.div`
  margin-top: 8px;
`;
