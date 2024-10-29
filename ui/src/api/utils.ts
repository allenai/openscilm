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
}

export const convertIterationToSection = (iteration: IterationType): ReportSection => {
  let text = iteration.text;
  iteration.citations.forEach(citation => {
    text = text.replaceAll(citation.id, `<Paper corpusId="${citation.corpus_id}" paperTitle="${citation.id}" isShortName></Paper>`);
  });
  console.log(text);
  return {
    id: 'id',
    text,
    title: '',
    citations: iteration.citations.map(citation => ({
      id: citation.id,
      corpusId: citation.corpus_id,
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
  return await response.json() as unknown as StatusType;
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