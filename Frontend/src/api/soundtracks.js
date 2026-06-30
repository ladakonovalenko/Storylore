import client from './client'

export const getProjectSoundtracks = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/soundtracks`)
  return data
}

export const createSoundtrack = async (payload) => {
  const { data } = await client.post('/soundtracks', payload)
  return data
}

export const updateSoundtrack = async (id, payload) => {
  const { data } = await client.put(`/soundtracks/${id}`, payload)
  return data
}

export const deleteSoundtrack = async (id) => {
  const { data } = await client.delete(`/soundtracks/${id}`)
  return data
}
