import reactToText from 'react-to-text';

import React from 'react';
import { Box, Link, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
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
  .replaceAll(/ \d\d\d\d[a-z]?"/g, ' year"')
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
        a: {
          component: (props) => <Link {...props} />,
          props: { paragraph: true, variant: 'body1', style: {
            color: 'rgba(10, 142, 98, 1)'
          } },
        },
        Paper: {
          component: (props: Partial<InlinePaperChipWidgetProps>) => {
            const { corpusId, paperTitle, children, fullTitle, id, ...rest } = props;
            let paperTitleStr = paperTitle;
            if (!paperTitleStr && children) {
              paperTitleStr = reactToText(children);
            }

            if (corpusId && paperTitleStr && id) {
              console.log('X1', section.corpusId2Details?.[corpusId])
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
    <Box sx={{ padding: {xs: '16px', sm: '32px'}, background: '#FAF2E9', borderRadius: '4px', color: '#0A3235' }}>
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
            Compare with draft
          </ToggleButton>
        </ToggleButtonGroup>
      )}
      {content}
    </Box>
  );
};
