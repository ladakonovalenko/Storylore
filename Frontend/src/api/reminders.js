import client from './client'

export const getProjectReminders = async (projectId) => {
  const { data } = await client.get(`/projects/${projectId}/reminders`)
  return data
}

export const createReminder = async (payload) => {
  const { data } = await client.post('/reminders', payload)
  return data
}

export const updateReminder = async (id, payload) => {
  const { data } = await client.put(`/reminders/${id}`, payload)
  return data
}

export const deleteReminder = async (id) => {
  const { data } = await client.delete(`/reminders/${id}`)
  return data
}
