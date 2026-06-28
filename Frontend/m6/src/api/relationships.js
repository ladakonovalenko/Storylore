import client from './client'

export const getRelationships = async () => {
  const { data } = await client.get('/relationships')
  return data
}

export const createRelationship = async (payload) => {
  const { data } = await client.post('/relationships', payload)
  return data
}

export const updateRelationship = async (id, payload) => {
  const { data } = await client.put(`/relationships/${id}`, payload)
  return data
}

export const deleteRelationship = async (id) => {
  const { data } = await client.delete(`/relationships/${id}`)
  return data
}

export const addRelationshipHistory = async (payload) => {
  // POST /relationships/history
  // payload: { relationship_id, description, date?, ... }
  const { data } = await client.post('/relationships/history', payload)
  return data
}
