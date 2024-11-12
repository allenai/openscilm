import reactToText from 'react-to-text';

import React from 'react';
import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import styled from 'styled-components';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import { InlinePaperChipWidgetWithEvidence } from '../widgets/InlinePaperChipWidgetWithEvidence';
import { InlinePaperChipWidgetProps } from '../widgets/InlinePaperChipWidget';
import { ReportSection } from '../../models/Report';
import ReactDiffViewer from 'react-diff-viewer'
import { split } from "sentence-splitter"



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
          props: { paragraph: true, variant: 'body1' },
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
${section.citations?.map((citation) => {
            console.log(citation)
            return `- <Paper corpusId="${citation.corpusId}" id="${citation.id}" paperTitle="${citation.anchorText}" fullTitle="${citation.fullTitle}" isShortName></Paper>: ${citation.snippets.join('... ')}`;
          }).join('\n')}`}
        </Markdown>
      </>
    );

  }

  return (
        <SectionContainer>
          {previousSection && (

            <ToggleButtonGroup
              color="primary"
              value={showDiff ? 'show' : 'hide'}
              exclusive
              onChange={() => setShowDiff(x => !x)}
              aria-label="text alignment"
              style={{ marginBottom: '16px' }}
            >
              <ToggleButton size='small' value={'show'} aria-label="left aligned" >
                Compare with previous iteration
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          {content}
        </SectionContainer>
  );
};


const SectionContainer = styled('div')`
  padding: 32px 32px;
  background: #FAF2E9;
  border-radius: 4px;
  color: #0A3235;
`;
