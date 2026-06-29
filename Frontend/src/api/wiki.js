import client from './client'

export const getProjectWikiArticles = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/wiki-articles`)
  return data
}

export const createWikiArticle = async (payload) => {
  const { data } = await client.post('/wiki-articles', payload)
  return data
}

export const updateWikiArticle = async (id, payload) => {
  const { data } = await client.put(`/wiki-articles/${id}`, payload)
  return data
}

export const setWikiArticleLinks = async (id, links) => {
  const { data } = await client.put(`/wiki-articles/${id}/links`, { links })
  return data
}

export const deleteWikiArticle = async (id) => {
  const { data } = await client.delete(`/wiki-articles/${id}`)
  return data
}
