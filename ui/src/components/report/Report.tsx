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
import { reportWidgetFactory } from '../../models/Report';

  const reportData = reportWidgetFactory({ sections: MockData });

export const Report = (): React.ReactNode => {

  const [expandedIndicies, setExpandedIndicies] = React.useState<Set<number>>(
    new Set<number>(),
  );
  useEffect(() => {
    setExpandedIndicies(new Set([]));
  }, [reportData]);

  const handleOnChange = (idx: number, isExpanded: boolean) => {
    setExpandedIndicies((old) => {
      const newExpandedIndicies = new Set(old);
      if (isExpanded) {
        newExpandedIndicies.add(idx);
      } else {
        newExpandedIndicies.delete(idx);
      }
      return newExpandedIndicies;
    });
  };
  reportData.sections

  return (
    <div>
      <DocumentContainer>
        {reportData?.sections?.map((section, idx) => {
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
            <AccordionContainer key={`${section.title}-${idx}`}>
              <StyledAccordion
                expanded={expandedIndicies.has(idx)}
                onChange={(_event, isExpanded) => {
                  handleOnChange(idx, isExpanded);
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <div>
                    <Typography variant="h6" component="h6" color="primary">
                      {section.title}
                    </Typography>
                    {section.tldr && !expandedIndicies.has(idx) && (
                      <Typography variant="body1" component="p">
                        {section.tldr}
                      </Typography>
                    )}
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <SectionContainer>
                    <Markdown options={markdownOptions}>
                      {section.text}
                    </Markdown>
                  </SectionContainer>
                </AccordionDetails>
              </StyledAccordion>
            </AccordionContainer>
          );
        })}
      </DocumentContainer>
    </div>
  );
};

const DocumentContainer = styled('div')`
  padding: 0 12px;
`;

const StyledAccordion = styled(Accordion)`
  background: #f7f0e8;
`;

const SectionContainer = styled('div')`
  padding: 12px;
  background: white;
  border-radius: 6px;
`;

const AccordionContainer = styled('div')`
  margin-bottom: 6px;
`;
