import { ReportSection } from "../models/Report";

export const BACKEND_ENDPOINT = '/api/query_open_scholar'
export const BACKEND_DEFAULT_INIT = {
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  },
  method: 'POST'
}


export interface StatusType {
  task_id: string;
  query: string;
  task_result: null | TaskResultType;
}

interface CitationType {
  id: string;
  corpus_id: number;
  snippet: string;
}

interface IterationType {
  text: string;
  citations: CitationType[];
}

interface TaskResultType {
  iterations: IterationType[];
  sections: ReportSection[];
}

interface AuthorType {
  authorId: string;
  name: string;
}
interface PaperDetailsType {
  title: string;
  year: number;
  corpusId: number;
  authors: AuthorType[];

}

export const fetchPapersDetails = async (corpusIds: number[], fields: string[] = ['title', 'authors', 'year', 'corpusId']) => {
  const response = await fetch(
    '/api/paper_details',
    {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corpus_ids: corpusIds, fields })
    }
  );
  // return (await response.json() as unknown as {detail: PaperDetailsType[]}).detail;
  return await response.json() as unknown as PaperDetailsType[]
}

export const convertIterationToSection = async (iteration: IterationType): Promise<ReportSection> => {
  let text = iteration.text;
  const corpusIds = [...new Set(iteration.citations.map(citation => citation.corpus_id))];
  const details = await fetchPapersDetails(corpusIds);
  const corpusId2RefText: { [corpusId: number]: string } = {}
  const corpusId2Title: { [corpusId: number]: string } = {}
  const counter: { [text: string]: number } = {}
  const firstKeyByValue: { [value: string]: number } = {}
  console.log('DETAILS', details)
  details.forEach(detail => {
    corpusId2Title[detail.corpusId] = detail.title ?? 'unknown'
  })
  details.forEach(detail => {
    try {
      let authorText = `${detail.authors[0].name.split(' ').at(-1)}`
      if (detail.authors.length > 1) {
        authorText += ` et al. ${detail.year}`
      } else {
        authorText += `. ${detail.year}`
      }
      counter[authorText] = (counter[authorText] ?? 0) + 1
      if (counter[authorText] > 1) {
        authorText += String.fromCharCode('a'.charCodeAt(0) + counter[authorText] - 1)
        // if (counter[authorText] == 2) {
        //   corpusId2RefText[firstKeyByValue[authorText]] += 'a'
        // }
      } else {
        firstKeyByValue[authorText] = detail.corpusId
      }
      corpusId2RefText[detail.corpusId] = `${authorText}`
    } catch (e) {
      console.error('parsing paper details error', e)
    }
  })
  console.log(details)
  iteration.citations.forEach(citation => {
    text = text.replaceAll(citation.id, `<Paper corpusId="${citation.corpus_id}" paperTitle="(${corpusId2RefText[citation.corpus_id] ?? citation.id})" fullTitle="${corpusId2Title[citation.corpus_id]}" isShortName></Paper>`);
  });
  console.log(text);
  return {
    id: 'id',
    text,
    title: '',
    citations: iteration.citations.map(citation => ({
      id: citation.id,
      corpusId: citation.corpus_id,
      title: corpusId2Title[citation.corpus_id],
      snippets: [citation.snippet]
    }))
  }
}


export const updateStatus = async (taskId: string) => {
  const response = await fetch(BACKEND_ENDPOINT, {
    ...BACKEND_DEFAULT_INIT,
    body: JSON.stringify({
      task_id: taskId,
      feedback_toggle: true
    })
  });
  const output = await response.json() as unknown as StatusType;
  const lastIteration = output.task_result?.iterations?.at(-1)
  if (output.task_result && lastIteration) {
    // output.task_result.sections = await Promise.all(output.task_result.iterations.map(convertIterationToSection));
    output.task_result.sections = [await convertIterationToSection(lastIteration)]
  }
  return output
}

export const createTask = async (query: string) => {
  const response = await fetch(BACKEND_ENDPOINT, {
    ...BACKEND_DEFAULT_INIT,
    body: JSON.stringify({
      query,
      feedback_toggle: true
    })
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json() as unknown as StatusType;
}