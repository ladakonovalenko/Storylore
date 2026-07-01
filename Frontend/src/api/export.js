import client from './client'

/**
 * Завантажує повний Markdown-експорт проєкту і одразу ініціює збереження
 * файлу в браузері. Через client (не звичайний <a href>), бо запит має
 * нести заголовок авторизації (Bearer-токен) — простий лінк цього не вміє.
 */
export const exportProjectMarkdown = async (projectId, projectTitle = 'project') => {
  const response = await client.get(`/projects/${projectId}/export-markdown`, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'text/markdown;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)

  const safeFilename = projectTitle.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄ0-9 _-]/g, '').trim() || 'project'

  const link = document.createElement('a')
  link.href = url
  link.download = `${safeFilename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
