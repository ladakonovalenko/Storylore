import client from './client'

export const getEvents = async (params = {}) => {
  const { data } = await client.get('/events', { params })
  return data
}

export const getEvent = async (id) => {
  const { data } = await client.get(`/events/${id}`)
  return data
}

export const createEvent = async (payload) => {
  const { data } = await client.post('/events', payload)
  return data
}

export const updateEvent = async (id, payload) => {
  const { data } = await client.put(`/events/${id}`, payload)
  return data
}

export const deleteEvent = async (id) => {
  const { data } = await client.delete(`/events/${id}`)
  return data
}
