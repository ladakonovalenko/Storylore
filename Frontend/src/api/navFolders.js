import client from './client'

export const getNavFolders = async () => {
  const { data } = await client.get('/nav-folders')
  return data
}

export const createNavFolder = async (name) => {
  const { data } = await client.post('/nav-folders', { name })
  return data
}

export const updateNavFolder = async (id, payload) => {
  const { data } = await client.put(`/nav-folders/${id}`, payload)
  return data
}

export const deleteNavFolder = async (id) => {
  const { data } = await client.delete(`/nav-folders/${id}`)
  return data
}

export const addNavItem = async (folderId, itemType, itemKey) => {
  const { data } = await client.post(`/nav-folders/${folderId}/items`, { item_type: itemType, item_key: itemKey })
  return data
}

export const updateNavItem = async (id, payload) => {
  const { data } = await client.put(`/nav-items/${id}`, payload)
  return data
}

export const deleteNavItem = async (id) => {
  const { data } = await client.delete(`/nav-items/${id}`)
  return data
}
