import client from './client'

export const getProjectStructureBlocks = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/structure-blocks`)
  return data
}

export const createStructureBlock = async (payload) => {
  const { data } = await client.post('/structure-blocks', payload)
  return data
}

export const updateStructureBlock = async (id, payload) => {
  const { data } = await client.put(`/structure-blocks/${id}`, payload)
  return data
}

export const deleteStructureBlock = async (id) => {
  const { data } = await client.delete(`/structure-blocks/${id}`)
  return data
}

// blockIds — повний масив id у новому порядку
export const reorderStructureBlocks = async (projectId, blockIds) => {
  const { data } = await client.put(`/projects/${projectId}/structure-blocks/reorder`, { block_ids: blockIds })
  return data
}
