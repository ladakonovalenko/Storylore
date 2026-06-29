import client from './client'

export const getPlotOutline = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/plot-outline`)
  return data
}

export const updatePlotOutline = async (projectId, payload) => {
  const { data } = await client.put(`/projects/${projectId}/plot-outline`, payload)
  return data
}
