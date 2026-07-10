import client from './client'

export const createFactionTemplate = async (payload) => {
  const { data } = await client.post('/faction-templates', payload)
  return data
}

export const getProjectFactionTemplates = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/faction-templates`)
  return data
}

export const updateFactionTemplate = async (id, payload) => {
  const { data } = await client.put(`/faction-templates/${id}`, payload)
  return data
}

export const deleteFactionTemplate = async (id) => {
  const { data } = await client.delete(`/faction-templates/${id}`)
  return data
}

export const addFactionTemplateField = async (templateId, payload) => {
  const { data } = await client.post(`/faction-templates/${templateId}/fields`, payload)
  return data
}

export const updateFactionTemplateField = async (fieldId, payload) => {
  const { data } = await client.put(`/faction-template-fields/${fieldId}`, payload)
  return data
}

export const deleteFactionTemplateField = async (fieldId) => {
  const { data } = await client.delete(`/faction-template-fields/${fieldId}`)
  return data
}

export const reorderFactionTemplateFields = async (templateId, fieldIds) => {
  const { data } = await client.put(`/faction-templates/${templateId}/fields/reorder`, { field_ids: fieldIds })
  return data
}

export const getFactionCustomValues = async (factionId) => {
  const { data } = await client.get(`/factions/${factionId}/custom-values`)
  return data
}

export const setFactionCustomValues = async (factionId, values) => {
  const { data } = await client.put(`/factions/${factionId}/custom-values`, { values })
  return data
}
