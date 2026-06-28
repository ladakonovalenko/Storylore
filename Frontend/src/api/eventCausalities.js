import client from './client'

export const getProjectEventCausalities = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/event-causalities`)
  return data
}

export const createEventCausality = async (payload) => {
  const { data } = await client.post('/event-causalities', payload)
  return data
}

export const deleteEventCausality = async (id) => {
  const { data } = await client.delete(`/event-causalities/${id}`)
  return data
}
