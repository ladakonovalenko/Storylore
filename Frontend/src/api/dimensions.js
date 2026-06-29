import client from './client'

export const getProjectDimensions = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/dimensions`)
  return data
}

export const createDimension = async (payload) => {
  const { data } = await client.post('/dimensions', payload)
  return data
}

export const updateDimension = async (id, payload) => {
  const { data } = await client.put(`/dimensions/${id}`, payload)
  return data
}

export const deleteDimension = async (id) => {
  const { data } = await client.delete(`/dimensions/${id}`)
  return data
}
