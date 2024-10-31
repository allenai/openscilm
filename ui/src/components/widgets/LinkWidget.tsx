import { styled } from '@mui/material';
import React from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

type LinkWidgetProps = React.PropsWithChildren<{
  url: string;
  className?: string;
}>;

const LinkWidget = ({ url, children, className }: LinkWidgetProps) => {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      {typeof children === 'string' && <LinkIcon />}
    </Link>
  );
};

export default LinkWidget;

const Link = styled('a')`
  margin: 0;
  padding: 0;
  text-decoration: none;
`;

const LinkIcon = styled(OpenInNewIcon)`
  font-size: 16px;
  margin: 0 0 -3px 2px;
`;
