import client from './client'

export const getProjectArcs = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/arcs`)
  return data
}

export const createArc = async (payload) => {
  const { data } = await client.post('/arcs', payload)
  return data
}

export const updateArc = async (id, payload) => {
  const { data } = await client.put(`/arcs/${id}`, payload)
  return data
}

export const deleteArc = async (id) => {
  const { data } = await client.delete(`/arcs/${id}`)
  return data
}

// roles: [{ character_id, role }]
export const setArcCharacters = async (arcId, roles) => {
  const { data } = await client.put(`/arcs/${arcId}/characters`, { roles })
  return data
}
