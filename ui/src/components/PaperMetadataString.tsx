
import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en'
TimeAgo.addDefaultLocale(en)

import { AuthorType } from '../api/utils';


export interface PropType {
  authors: AuthorType[];
  year: number;
  venue: string;
  maxAuthors?: number;
  title: string;
}

export const PaperMetadataString = (props: PropType): string => {
  const { authors: allAuthors, title, year, venue, maxAuthors = 6} = props;
  const authors = allAuthors.slice(0, maxAuthors);
  const truncated = allAuthors.length > maxAuthors;
  console.log('authors', authors);

  return (
      `${authors.map((author, index) => {
        console.log(author, index)
        const out = (`
          <a key={author.authorId} target='_blank' href="https://www.semanticscholar.org/author/${author.authorId}">${author.name}</a>${index < authors.length - 1 ? ', ' : ''}`)
          console.log(out)
        return out}).join('')}${truncated ? 'et al' : ''}. ${title}. ${year}. ${venue}.
      `
  );
};
