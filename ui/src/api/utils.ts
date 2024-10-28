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
  task_result: null | object;
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