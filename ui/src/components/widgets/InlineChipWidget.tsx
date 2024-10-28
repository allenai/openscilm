import classnames from 'classnames';
import { Chip, styled } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import React from 'react';

type InlineChipWidgetProps = {
  label: string;
  onClick?: () => Promise<any> | any;
  icon?: React.ReactElement | boolean;
  type?: TYPE;
  size?: SIZE;
  isMultiLine?: boolean;
  isDarkMode?: boolean;
};

export enum TYPE {
  default = 'default',
  bold = 'bold',
}

export enum SIZE {
  small = 'small',
  medium = 'medium',
}

export const InlineChipWidget = ({
  label,
  onClick,
  icon = true,
  type = TYPE.default,
  size = SIZE.medium,
  isMultiLine,
  isDarkMode,
}: InlineChipWidgetProps) => {
  const renderIcon = (): React.ReactElement | undefined => {
    if (typeof icon === 'boolean') {
      return icon ? <KeyboardArrowDownIcon /> : undefined;
    }
    return icon;
  };
  return (
    <StyledChip
      icon={renderIcon()}
      label={label}
      onClick={onClick}
      className={classnames({
        'inline-chip--dark': isDarkMode,
        'inline-chip--multiline': isMultiLine,
        'inline-chip--size-small': size === SIZE.small,
        'inline-chip--type-bold': type === TYPE.bold,
        'inline-chip--wrap': !isMultiLine,
      })}
      size={size}
      data-testid="inline-chip-widget"
    ></StyledChip>
  );
};

// Fix after theme test bug has been fixed
// light background: ${({ theme }) => `${theme.palette.background.paper}`}
// light label: ${({ theme }) => `${theme.palette.text.primary}`}
// light icon: ${({ theme }) => `${theme.palette.tertiary.dark}`}
// dark background: ${({ theme }) => alpha(`${theme.palette.background.paper}`, 0.1)}
// dark label: ${({ theme }) => `${theme.palette.text.reversed}`}
// dark icon: ${({ theme }) => `${theme.palette.tertiary.light}`}

export const StyledChip = styled(Chip)`
  align-items: center;
  background-color: rgba(250, 242, 233, 1);
  border-radius: 4px;
  height: auto;

  .MuiChip-label {
    color: rgba(10, 50, 53, 1);
    font-size: 16px;
    font-weight: 400;
    padding: 0 4px;
    white-space: nowrap;
  }

  .MuiChip-icon {
    fill: rgba(10, 142, 98, 1);
    font-size: 1.4em;
    margin: 0 0 0 2px;
    opacity: 0.75;
  }

  &.inline-chip--dark {
    background-color: rgba(250, 242, 233, 0.1);

    .MuiChip-label {
      color: rgba(250, 242, 233, 1);
    }

    .MuiChip-icon {
      fill: rgba(63, 213, 163, 1);
    }
  }

  &.inline-chip--multiline {
    align-items: start;

    .MuiChip-label {
      white-space: normal;
    }

    .MuiChip-icon {
      padding: 2px 0 0 2px;
    }
  }

  &.inline-chip--size-small {
    .MuiChip-label {
      font-size: 14px;
    }
  }

  &.inline-chip--type-bold {
    .MuiChip-label {
      font-weight: 700;
    }
  }

  &.inline-chip--wrap {
    background: none;
    border-bottom: 1px dashed rgba(38, 239, 172, 0.8);
    border-radius: 0;
    display: inline;
    margin-top: -1px;
    transition: border-color 200ms ease-in-out;

    &:hover {
      border-color: rgba(38, 239, 172, 1);
      transition-duration: 75ms;
    }

    .MuiChip-icon {
      display: none;
    }

    .MuiChip-label {
      background: none;
      display: inline;
      line-height: 1;
      margin: 0;
      overflow: initial;
      padding: 0;
      text-overflow: initial;
      text-wrap: initial;
      white-space: initial;
    }
  }
`;

export const StyledDescription = styled('p')`
  text-wrap: wrap;
  max-width: 560px;
  padding-left: 18px;
  padding-right: 18px;
`;

export const AnchorButton = styled('a')`
  padding: 0;
  margin: 0;
  border: 0;
  text-decoration: none;
`;

export const LinkedMenuItemText = styled('a')`
  color: unset;
  &:hover {
    text-decoration: none;
    color: unset;
  }
`;
LinkedMenuItemText.defaultProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};
