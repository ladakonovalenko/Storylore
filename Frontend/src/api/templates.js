import client from './client'

export async function getTemplates() {
  const { data } = await client.get('/characters/templates')
  return data
}

export async function getTemplateByKey(templateKey) {
  const { data } = await client.get(`/characters/templates/${templateKey}`)
  return data
}
