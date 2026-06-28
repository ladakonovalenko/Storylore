import client from './client'

export const getProjectLocationRelationships = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/location-relationships`)
  return data
}

export const createLocationRelationship = async (payload) => {
  const { data } = await client.post('/location-relationships', payload)
  return data
}

export const updateLocationRelationship = async (id, payload) => {
  const { data } = await client.put(`/location-relationships/${id}`, payload)
  return data
}

export const deleteLocationRelationship = async (id) => {
  const { data } = await client.delete(`/location-relationships/${id}`)
  return data
}
