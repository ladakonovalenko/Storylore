import client from './client'

export const getProjectMoodboardImages = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/moodboard-images`)
  return data
}

export const createMoodboardImage = async (payload) => {
  const { data } = await client.post('/moodboard-images', payload)
  return data
}

export const updateMoodboardImage = async (id, payload) => {
  const { data } = await client.put(`/moodboard-images/${id}`, payload)
  return data
}

export const deleteMoodboardImage = async (id) => {
  const { data } = await client.delete(`/moodboard-images/${id}`)
  return data
}
