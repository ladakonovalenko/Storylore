import client from './client'

export async function getProjects() {
  const { data } = await client.get('/projects')
  return data
}

export async function createProject(payload) {
  const { data } = await client.post('/projects', payload)
  return data
}

// НОВЕ: редагування проєкту
export async function updateProject(id, payload) {
  const { data } = await client.put(`/projects/${id}`, payload)
  return data
}

// НОВЕ: видалення проєкту
export async function deleteProject(id) {
  const { data } = await client.delete(`/projects/${id}`)
  return data
}