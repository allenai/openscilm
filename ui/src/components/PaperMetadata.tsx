import React from 'react';
import { Card, CardContent, CardMedia, CircularProgress, Link, Typography } from '@mui/material';

import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en'
TimeAgo.addDefaultLocale(en)

import { AuthorType } from '../api/utils';


export interface PropType {
  authors: AuthorType[];
  year: number;
  venue: string;
  title: string;
  maxAuthors?: number;
}

export const PaperMetadata: React.FC<PropType> = (props) => {
  const { authors: allAuthors, year, venue, maxAuthors = 6} = props;
  const authors = allAuthors.slice(0, maxAuthors);
  const truncated = allAuthors.length > maxAuthors;

  return (
    <div style={{ display: 'inline-block' }}>
      {authors.map((author, index) => (
        <React.Fragment  key={author.authorId}>
          <Link color='secondary' href={`https://www.semanticscholar.org/author/${author.authorId}`}>{author.name}</Link>
          {index < authors.length - 1 ? ', ' : ''}
        </React.Fragment>
      ))}{truncated ? 'et al' : ''}. {venue}. {year}.
    </div>
  );
};
