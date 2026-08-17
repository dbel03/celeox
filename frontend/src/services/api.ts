const API_URL = '/api'

export async function getMap() {
    const response = await fetch(`${API_URL}/map`)

    if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`)
    }

    return response.json()
}