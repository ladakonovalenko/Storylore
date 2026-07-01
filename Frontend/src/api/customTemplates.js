import client from './client'

export const getProjectCustomTemplates = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/custom-templates`)
  return data
}

export const getCustomTemplate = async (id) => {
  const { data } = await client.get(`/custom-templates/${id}`)
  return data
}

export const createCustomTemplate = async (payload) => {
  const { data } = await client.post('/custom-templates', payload)
  return data
}

export const updateCustomTemplate = async (id, payload) => {
  const { data } = await client.put(`/custom-templates/${id}`, payload)
  return data
}

export const deleteCustomTemplate = async (id) => {
  const { data } = await client.delete(`/custom-templates/${id}`)
  return data
}

export const addCustomTemplateField = async (templateId, payload) => {
  const { data } = await client.post(`/custom-templates/${templateId}/fields`, payload)
  return data
}

export const updateCustomTemplateField = async (id, payload) => {
  const { data } = await client.put(`/custom-template-fields/${id}`, payload)
  return data
}

export const deleteCustomTemplateField = async (id) => {
  const { data } = await client.delete(`/custom-template-fields/${id}`)
  return data
}

export const reorderCustomTemplateFields = async (templateId, fieldIds) => {
  const { data } = await client.put(`/custom-templates/${templateId}/fields/reorder`, { field_ids: fieldIds })
  return data
}
