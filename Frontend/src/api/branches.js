import client from './client'

export const getProjectBranches = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/branches`)
  return data
}

export const createBranch = async (payload) => {
  const { data } = await client.post('/branches', payload)
  return data
}

export const updateBranch = async (id, payload) => {
  const { data } = await client.put(`/branches/${id}`, payload)
  return data
}

export const deleteBranch = async (id) => {
  const { data } = await client.delete(`/branches/${id}`)
  return data
}
