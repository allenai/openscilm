import ArticleIcon from '@mui/icons-material/Article';

import { styled } from '@mui/material';


import React from 'react';

import {
  InlineChipWidget,
  TYPE,
  SIZE,
} from './InlineChipWidget';

export interface InlinePaperChipWidgetProps {
  corpusId: number;
  paperTitle: string;
  isMultiLine?: boolean;
  isFullWidth?: boolean;
  // Based on the grammar, gpt sometimes use a short name to refer to a paper instead of the full title (eg PaperWeaver), in this case we want to show the paper chip inline
  isShortName?: boolean;
  isDarkMode?: boolean;
  fullTitle: string;
  id: string;
  children?: React.ReactNode;
}

export const InlinePaperChipWidget: React.FC<InlinePaperChipWidgetProps> = (
  props,
) => {
  const {
    paperTitle,
    isMultiLine,
    isShortName,
    isFullWidth = false,
    isDarkMode,
  } = props;

  return (
    <TitleChipContainer
      isMultiLine={!!isMultiLine}
      isShortName={!!isShortName}
      isFullWidth={!!isFullWidth}
    >
      <InlineChipWidget
        label={paperTitle}
        type={TYPE.default}
        icon={<ArticleIcon />}
        size={SIZE.medium}
        isMultiLine={isMultiLine}
        isDarkMode={isDarkMode}
      />
    </TitleChipContainer>
  );
};

const TitleChipContainer = styled('span')(
  ({
    isMultiLine,
    isShortName,
    isFullWidth,
  }: {
    isMultiLine: boolean;
    isShortName: boolean;
    isFullWidth: boolean;
  }) => ({
    display: isMultiLine || isShortName ? 'inline-block' : 'block',
    width: isMultiLine && !isFullWidth ? '260px' : 'unset',
  }),
);
