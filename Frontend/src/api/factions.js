import client from './client'

export const createFaction = async (payload) => {
  const { data } = await client.post('/factions', payload)
  return data
}

export const getProjectFactions = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/factions`)
  return data
}

// НОВЕ: редагування фракції
export const updateFaction = async (id, payload) => {
  const { data } = await client.put(`/factions/${id}`, payload)
  return data
}

// НОВЕ: видалення фракції
export const deleteFaction = async (id) => {
  const { data } = await client.delete(`/factions/${id}`)
  return data
}

// НОВЕ: масове призначення персонажів фракції (замінює повний список учасників)
export const setFactionCharacters = async (factionId, characterIds) => {
  const { data } = await client.put(`/factions/${factionId}/characters`, { character_ids: characterIds })
  return data
}
