const API_URL = '/api'

export async function getMap() {
    const response = await fetch(`${API_URL}/map`)

    if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`)
    }

    return response.json()
}

export interface MountainFeature {
    id: string
    type: string
    name: string | null
    latitude: number
    longitude: number
    tags: Record<string, string> | null
}

export async function getSprings(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
): Promise<MountainFeature[]> {
    const params = new URLSearchParams({
        minLat: minLat.toString(),
        maxLat: maxLat.toString(),
        minLon: minLon.toString(),
        maxLon: maxLon.toString(),
    })

    const response = await fetch(
        `${API_URL}/osm/springs?${params.toString()}`
    )

    if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`)
    }

    return response.json()
}

export async function searchSprings(
    name: string
): Promise<MountainFeature[]> {

    const response = await fetch(
        `${API_URL}/osm/springs/search?name=${encodeURIComponent(name)}`
    )

    if (!response.ok) {
        throw new Error(
            'Error buscando fuentes'
        )
    }

    return response.json()
}