import client from './client'

export const getProjectEras = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/eras`)
  return data
}

export const createEra = async (payload) => {
  const { data } = await client.post('/eras', payload)
  return data
}

export const updateEra = async (id, payload) => {
  const { data } = await client.put(`/eras/${id}`, payload)
  return data
}

export const deleteEra = async (id) => {
  const { data } = await client.delete(`/eras/${id}`)
  return data
}
