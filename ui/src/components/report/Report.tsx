import reactToText from 'react-to-text';

import React from 'react';
import { Box, Link, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { lighten } from '@mui/material/styles';
import styled from 'styled-components';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import { InlinePaperChipWidgetWithEvidence } from '../widgets/InlinePaperChipWidgetWithEvidence';
import { InlinePaperChipWidgetProps } from '../widgets/InlinePaperChipWidget';
import { ReportSection } from '../../models/Report';
import ReactDiffViewer from 'react-diff-viewer'
import { split } from "sentence-splitter"
import { PaperMetadataString } from '../PaperMetadataString';



function clean(text: string) {
  const rawSplits = split(text)
  return rawSplits.map((sentence) => sentence.raw.trim()).join('\n').trim()
  .replaceAll(/ \d\d\d\d(\^\^\^\d+)?"/g, ' year"')
  .replaceAll(/\[\d+\]/g, "[id]")
}

export const Report: React.FC<{ section: ReportSection, previousSection?: ReportSection }> = (props) => {
  const { section, previousSection } = props;
  const [showDiff, setShowDiff] = React.useState(false);
  let content: React.ReactNode | null = null

  if (showDiff && previousSection) {
    content = (
      <ReactDiffViewer
        newValue={clean(section.text)}
        oldValue={clean(previousSection.text)}
        splitView={true}
      />
    )
  } else {

    const id2Snippets: { [id: string]: string[] } = {};
    section.citations?.forEach((citation) => {
      id2Snippets[citation.id] = citation.snippets;
    });

    const markdownOptions: MarkdownToJSX.Options = {
      overrides: {
        p: {
          component: (props) => <Typography {...props} />,
          props: { paragraph: true, variant: 'body1'},
        },
        h3: {
          component: (props) => <Typography {...props} />,
          props: {
            variant: 'h6',
            sx: {
              fontFamily: '"PP Telegraf", "Manrope", sans-serif',
              fontWeight: 'bold',
              fontSize: '18px',
              marginTop: '24px',
              marginBottom: '16px'
            }
          },
        },
        li: {
          component: (props) => <Box component="li" {...props} />,
          props: {
            sx: {
              marginBottom: '8px',
              '&:last-child': {
                marginBottom: 0
              }
            }
          },
        },
        a: {
          component: (props) => <Link {...props} />,
          props: {
            paragraph: true,
            variant: 'body1',
            sx: {
              color: (theme: any) => theme.color['green-100'].hex,
              transition: 'color 250ms ease-out',
              '&:hover': {
                color: (theme: any) => lighten(theme.color['green-100'].hex, 0.6)
              }
            }
          },
        },
        Paper: {
          component: (props: Partial<InlinePaperChipWidgetProps>) => {
            const { corpusId, paperTitle, children, fullTitle, id, ...rest } = props;
            let paperTitleStr = paperTitle;
            if (!paperTitleStr && children) {
              paperTitleStr = reactToText(children);
            }

            if (corpusId && paperTitleStr && id) {
              return (
                <InlinePaperChipWidgetWithEvidence
                  {...rest}
                  isShortName={true}
                  paperTitle={paperTitleStr}
                  corpusId={corpusId}
                  fullTitle={fullTitle ?? 'Error: Paper Title Unkonwn'}
                  id={id}
                  paperDetails={section.corpusId2Details?.[corpusId]}
                  evidences={
                    id2Snippets?.[id]?.map((snippet) => ({
                      text: snippet,
                    })) ?? []
                  }
                />
              );
            } else {
              return null;
            }
          },
        },
      },
    };

    content = (
      <>
        <Markdown options={markdownOptions}>
          {`${section.text}
### References
${Object.values(section.corpusId2Details ?? {}).map((details) => {
  return `- ${PaperMetadataString(details)}`
            // return `- ${details.title} ${details.venue} (${details.year})`;
          }
).join('\n')}
`}
        </Markdown>
      </>
    );

  }

  return (
    <Box sx={{
      borderTop: (theme) => `1px solid ${theme.color['off-white'].hex}1A`,
      color: (theme) => theme.color['off-white'].hex,
      paddingTop: '18px'
    }}>
      {previousSection && (

        <ToggleButtonGroup
          color="primary"
          value={showDiff ? 'show' : 'hide'}
          exclusive
          onChange={() => setShowDiff(x => !x)}
          aria-label="text alignment"
          style={{ marginBottom: '16px' }}
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          <ToggleButton size='small' value={'show'} aria-label="left aligned" >
            {showDiff ? 'Exit Comparison View' : 'Compare with draft'}
          </ToggleButton>
        </ToggleButtonGroup>
      )}
      {content}
    </Box>
  );
};
