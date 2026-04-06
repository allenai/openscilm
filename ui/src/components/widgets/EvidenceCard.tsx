/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { v4 as uuidV4 } from 'uuid';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { Box, Divider, Link, Popover, Typography } from '@mui/material';
import { lighten } from '@mui/material/styles';
import styled from 'styled-components';

import { EvidenceCardContent } from './EvidenceCardContent';
import { Evidence } from './utils';
import { PaperDetailsType } from 'src/api/utils';
import { PaperMetadata } from '../PaperMetadata';

export interface EvidenceCardProps{
  evidences: Evidence[];
  corpusId: number;
  children?: React.ReactNode;
  fullTitle: string;
  id: string;
  paperDetails?: PaperDetailsType
}

// This component can either look up evidence if an id is provided
// or use existing evidence provided to it

export const EvidenceCard = (props: EvidenceCardProps): React.ReactNode => {
  const { children, paperDetails, ...rest } = props;
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
        color={'unset'}
        onClick={handleClick}
        aria-describedby={id}
      >
        {children ?? <StyledFormatQuoteIcon />}
      </Link>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ maxWidth: '600px', maxHeight: '300px', overflow: 'auto', padding: {xs: '12px 16px 8px 16px', md: '16px 24px 8px 24px' }, backgroundColor: '#105257', color:'#FAF2E9'}}>
          <Typography sx={{ mb: 0, mt: 0.5, fontWeight: 'bold' }} variant="h6">
            <Link
              href={`https://semanticscholar.org/p/${props.corpusId}`}
              target='_blank'
              rel="noreferrer"
              sx={{
                color: (theme: any) => theme.color['green-100'].hex,
                fontFamily: '"PP Telegraf", "Manrope", sans-serif',
                fontWeight: 'bold',
                transition: 'color 250ms ease-out',
                '&:hover': {
                  color: (theme: any) => lighten(theme.color['green-100'].hex, 0.6)
                }
              }}
            >
              {rest.fullTitle}
            </Link>
          </Typography>
          {paperDetails && (
            <Typography sx={{ mb: 1.5, mt: 0 }} variant="body2">
              {PaperMetadata(paperDetails)}
            </Typography>
          )}
          <Divider sx={{ borderColor: (theme: any) => `${theme.color['off-white'].hex}33` }} />
          {open && <EvidenceCardContent {...rest} />}
        </Box>
      </Popover>
    </Container>
  );
};

const Container = styled.div`
  display: inline-block;
  margin-left: 4px;
`;

const CardContainer = styled.div`
  padding: px;
`;

const StyledFormatQuoteIcon = styled(FormatQuoteIcon)`
  font-size: 0.7em;
  vertical-align: top;
`;
