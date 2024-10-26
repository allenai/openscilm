import ArticleIcon from '@mui/icons-material/Article';

import { Divider, Menu, MenuItem, styled } from '@mui/material';

import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import React, { useCallback, useEffect } from 'react';

import { isCorpusIdShowable } from './utils';
import {
  InlineChipWidget,
  TYPE,
  SIZE,
  LinkedMenuItemText,
  AnchorButton,
  StyledDescription,
} from './InlineChipWidget';

export interface InlinePaperChipWidgetProps {
  corpusId: number;
  paperTitle: string;
  isMultiLine?: boolean;
  isFullWidth?: boolean;
  // Based on the grammar, gpt sometimes use a short name to refer to a paper instead of the full title (eg PaperWeaver), in this case we want to show the paper chip inline
  isShortName?: boolean;
  isDarkMode?: boolean;
  hideAddPaperToTable?: boolean;
  children?: React.ReactNode;
}

export const InlinePaperChipWidget: React.FC<InlinePaperChipWidgetProps> = (
  props,
) => {
  const {
    corpusId,
    paperTitle,
    isMultiLine,
    isShortName,
    isFullWidth = false,
    hideAddPaperToTable = false,
    isDarkMode,
  } = props;
  const [isShowable, setIsShowable] = React.useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    isCorpusIdShowable(corpusId).then((isShowable) => {
      setIsShowable(isShowable);
    });
  }, [corpusId]);

  return (
    <TitleChipContainer
      isMultiLine={!!isMultiLine}
      isShortName={!!isShortName}
      isFullWidth={!!isFullWidth}
    >
      <AnchorButton onClick={handleClick}>
        <InlineChipWidget
          label={paperTitle}
          type={TYPE.default}
          icon={isShowable ? <PictureAsPdfIcon /> : <ArticleIcon />}
          size={SIZE.medium}
          isMultiLine={isMultiLine}
          isDarkMode={isDarkMode}
          aria-controls={open ? 'paper-chip-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        />
      </AnchorButton>
      <Menu
        id="paper-chip-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {!isMultiLine && paperTitle.length > 25 && (
          <div>
            <StyledDescription>{paperTitle}</StyledDescription>
            <Divider />
          </div>
        )}
        <LinkedMenuItemText href={`https://semanticscholar.org/p/${corpusId}`}>
          <MenuItem onClick={handleClose}>Open Paper Details Page</MenuItem>
        </LinkedMenuItemText>

      </Menu>
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
