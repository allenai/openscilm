import reactToText from 'react-to-text';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Person2Icon from '@mui/icons-material/Person2';

import React, { useEffect } from 'react';
import { Typography } from '@mui/material';
import styled from 'styled-components';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import { InlinePaperChipWidgetWithEvidence } from '../widgets/InlinePaperChipWidgetWithEvidence';
import { InlinePaperChipWidgetProps } from '../widgets/InlinePaperChipWidget';
import LinkWidget from '../widgets/LinkWidget';
import { InlineChipWidget } from '../widgets/InlineChipWidget';
import { MockData } from './MockData';
import { ReportSection, reportWidgetFactory } from '../../models/Report';


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
      Author: {
        component: (props) => {
          const { authorId, children } = props;
          const authorName = reactToText(children);
          if (authorId) {
            return (
              <LinkWidget
                url={`https://semanticscholar.org/author/${authorId}`}
              >
                <InlineChipWidget
                  label={authorName}
                  icon={<Person2Icon />}
                />
              </LinkWidget>
            );
          }
          return (
            <InlineChipWidget
              label={authorName}
              icon={<Person2Icon />}
            />
          );
        },
      },
      Paper: {
        component: (props: Partial<InlinePaperChipWidgetProps>) => {
          const { corpusId, paperTitle, children, ...rest } = props;
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
