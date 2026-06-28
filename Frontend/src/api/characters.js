import client from './client'

// ✅ ДОДАНО: підтримка фільтрації за project_id
export const getCharacters = async (projectId) => {
  const params = projectId ? { project_id: projectId } : {}
  const { data } = await client.get('/characters', { params })
  return data
}

export const getCharacter = async (id) => {
  const { data } = await client.get(`/characters/${id}`)
  return data
}

export const createCharacter = async (payload) => {
  const { data } = await client.post('/characters', payload)
  return data
}

const handleSave = async () => {
    console.log("Ось що ми відправляємо на сервер:", formData); // <--- ДОДАЙТЕ ЦЕ
    try {
        await updateCharacter(character.id, formData);
        alert("Збережено!");
    } catch (err) {
        console.error("Помилка запиту:", err);
    }
};

export const updateCharacter = async (id, payload) => {
  const { data } = await client.put(`/characters/${id}`, payload)
  return data
}

export const deleteCharacter = async (id) => {
  const { data } = await client.delete(`/characters/${id}`)
  return data
}
