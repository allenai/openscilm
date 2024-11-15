import React from 'react';
import { Divider, Typography } from '@mui/material';
import styled from 'styled-components';

import { EvidenceCardProps } from './EvidenceCard';
import { Evidence } from './utils';

const NO_ABSTRACT = 'Due to licensing constraints, we cannot display the abstract here. Please click on the title above to see the abstract.'

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
          <Typography sx={{ mt: 1.5, mb: 1.5 }} variant="body2">
            {evidence.text.length > 0 ? `"${evidence.text}"` : NO_ABSTRACT}
          </Typography>
        </EvidenceContainer>
      ))}
    </>
  );
};

const EvidenceContainer = styled.div`
  margin-top: 8px;
`;
