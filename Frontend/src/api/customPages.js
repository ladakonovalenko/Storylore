import client from './client'

export const getProjectCustomPages = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/custom-pages`)
  return data
}

export const createCustomPage = async (payload) => {
  const { data } = await client.post('/custom-pages', payload)
  return data
}

export const updateCustomPage = async (id, payload) => {
  const { data } = await client.put(`/custom-pages/${id}`, payload)
  return data
}

export const deleteCustomPage = async (id) => {
  const { data } = await client.delete(`/custom-pages/${id}`)
  return data
}

export const getCustomPageBlocks = async (pageId) => {
  const { data } = await client.get(`/custom-pages/${pageId}/blocks`)
  return data
}

// НОВЕ: усі блоки всіх власних сторінок проєкту одним запитом —
// для пошуку по вмісту в SearchModal (щоб не робити запит на кожну сторінку окремо)
export const getProjectCustomPageBlocks = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/custom-pages/blocks`)
  return data
}

export const createCustomPageBlock = async (payload) => {
  const { data } = await client.post('/custom-page-blocks', payload)
  return data
}

export const updateCustomPageBlock = async (id, payload) => {
  const { data } = await client.put(`/custom-page-blocks/${id}`, payload)
  return data
}

export const deleteCustomPageBlock = async (id) => {
  const { data } = await client.delete(`/custom-page-blocks/${id}`)
  return data
}

export const reorderCustomPageBlocks = async (pageId, blockIds) => {
  const { data } = await client.put(`/custom-pages/${pageId}/blocks/reorder`, { block_ids: blockIds })
  return data
}
