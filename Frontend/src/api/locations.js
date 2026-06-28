import client from './client'

export const getProjectLocations = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/locations`)
  return data
}

export const createLocation = async (payload) => {
  const { data } = await client.post('/locations', payload)
  return data
}

export const updateLocation = async (id, payload) => {
  const { data } = await client.put(`/locations/${id}`, payload)
  return data
}

export const deleteLocation = async (id) => {
  const { data } = await client.delete(`/locations/${id}`)
  return data
}
