import client from './client'

export const getCharacters = async () => {
  const { data } = await client.get('/characters')
  return data
}

export const getCharacter = async (id) => {
  const { data } = await client.get(`/characters/${id}`)
  return data
}

export const createCharacter = async (payload) => {
  const { data } = await client.post('/characters', payload)
  return data
}

export const updateCharacter = async (id, payload) => {
  const { data } = await client.put(`/characters/${id}`, payload)
  return data
}

export const deleteCharacter = async (id) => {
  const { data } = await client.delete(`/characters/${id}`)
  return data
}
