/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { v4 as uuidV4 } from 'uuid';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { Divider, Link, Popover, Typography } from '@mui/material';
import styled from 'styled-components';

import { EvidenceCardContent } from './EvidenceCardContent';
import { Evidence } from './utils';

export interface EvidenceCardProps{
  evidences: Evidence[];
  corpusId: number;
  children?: React.ReactNode;
  fullTitle: string;
  id: string;
}

// This component can either look up evidence if an id is provided
// or use existing evidence provided to it

export const EvidenceCard = (props: EvidenceCardProps): React.ReactNode => {
  const { children, ...rest } = props;
  const [anchorEl, setAnchorEl] = React.useState<HTMLAnchorElement | null>(
    null,
  );

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? `evidence-popover-${uuidV4()}` : undefined;

  return (
    <Container>
      <Link
        href="#"
        variant="body2"
        onClick={handleClick}
        aria-describedby={id}
      >
        {children ?? <StyledFormatQuoteIcon />}
      </Link>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        style={{ width: '500px' }}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <CardContainer>
          <Typography sx={{ mb: 1.5, mt: 0.5 }} variant="h6">
            <Link href={`https://semanticscholar.org/p/${props.corpusId}`} target='_blank' rel="noreferrer">
              {rest.fullTitle}
            </Link>
          </Typography>
          <Divider />
          {open && <EvidenceCardContent {...rest} />}
        </CardContainer>
      </Popover>
    </Container>
  );
};

const Container = styled.div`
  display: inline-block;
  margin-left: 4px;
`;

const CardContainer = styled.div`
  padding: 14px;
  width: 420px;
  max-height: 300px;
  overflow: auto;
`;

const StyledFormatQuoteIcon = styled(FormatQuoteIcon)`
  font-size: 0.7em;
  vertical-align: top;
`;
