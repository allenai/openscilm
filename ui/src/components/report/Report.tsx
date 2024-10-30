import reactToText from 'react-to-text';

import React from 'react';
import { Typography } from '@mui/material';
import styled from 'styled-components';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import { InlinePaperChipWidgetWithEvidence } from '../widgets/InlinePaperChipWidgetWithEvidence';
import { InlinePaperChipWidgetProps } from '../widgets/InlinePaperChipWidget';
import { ReportSection } from '../../models/Report';


export const Report: React.FC<{ section: ReportSection }> = (props) => {
  const { section } = props;

  const corpusId2Snippets: { [corpusId: number]: string[] } = {};
  section.citations?.forEach((citation) => {
    corpusId2Snippets[citation.corpusId] = citation.snippets;
  });

  const markdownOptions: MarkdownToJSX.Options = {
    overrides: {
      p: {
        component: (props) => <Typography {...props} />,
        props: { paragraph: true, variant: 'body1' },
      },
      Paper: {
        component: (props: Partial<InlinePaperChipWidgetProps>) => {
          const { corpusId, paperTitle, children, fullTitle, ...rest } = props;
          let paperTitleStr = paperTitle;
          if (!paperTitleStr && children) {
            paperTitleStr = reactToText(children);
          }

          if (corpusId && paperTitleStr) {
            return (
              <InlinePaperChipWidgetWithEvidence
                {...rest}
                isShortName={true}
                paperTitle={paperTitleStr}
                corpusId={corpusId}
                fullTitle={fullTitle ?? 'Error: Paper Title Unkonwn'}
                evidences={
                  corpusId2Snippets?.[corpusId]?.map((snippet) => ({
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

  return (
    <div style={{ color: '#3a3a3a' }}>
      <DocumentContainer>
        <SectionContainer>
          <Markdown options={markdownOptions}>
            {section.text}
          </Markdown>
        </SectionContainer>
      </DocumentContainer>
    </div>
  );
};

const DocumentContainer = styled('div')`
`;

const SectionContainer = styled('div')`
  padding: 20px 14px;
  background: #eaeaea;
  border-radius: 6px;
`;
