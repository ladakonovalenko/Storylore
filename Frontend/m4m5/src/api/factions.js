import client from './client'

export const createFaction = async (payload) => {
  const { data } = await client.post('/factions', payload)
  return data
}

export const getProjectFactions = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/factions`)
  return data
}
