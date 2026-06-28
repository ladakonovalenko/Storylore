import client from './client'

export const getRelationships = async (params = {}) => {
  const { data } = await client.get('/relationships', { params })
  return data
}

export const getCharacterRelationships = async (characterId) => {
  const { data } = await client.get(`/characters/${characterId}/relationships`)
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
