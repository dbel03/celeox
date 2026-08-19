import type { MountainFeature } from '../types/mountain'

export type { MountainFeature }


const API_URL = '/api'


/*
 * Lista de tipos de elemento que existen en el mapa.
 * Debe coincidir con SupportedTypes / TypeTagMap del backend
 * (OsmController / OsmService).
 */
export const FEATURE_TYPES = [
    'spring',
    'peak',
    'cave',
    'shelter',
    'viewpoint',
    'campsite',
    'hospital',
] as const

/*
 * FeatureType es un tipo "unión de literales" derivado de FEATURE_TYPES.
 * Equivale a: 'spring' | 'peak' | 'cave' | 'shelter' | 'viewpoint' | 'campsite' | 'hospital'
 *
 * Sirve para que TypeScript te avise si escribes un tipo que no existe
 * (ej. getFeatures('waterfall', ...) daría error de compilación),
 * y para tipar de forma segura los Record<FeatureType, ...> de icons.ts.
 */
export type FeatureType = typeof FEATURE_TYPES[number]


export async function getMap() {
    const response = await fetch(`${API_URL}/map`)

    if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`)
    }

    return response.json()
}


export async function getFeatures(
    type: FeatureType,
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
): Promise<MountainFeature[]> {
    const params = new URLSearchParams({
        type,
        minLat: minLat.toString(),
        maxLat: maxLat.toString(),
        minLon: minLon.toString(),
        maxLon: maxLon.toString(),
    })

    const response = await fetch(
        `${API_URL}/osm/features?${params.toString()}`
    )

    if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`)
    }

    return response.json()
}


/*
 * Carga TODOS los tipos a la vez para un área,
 * lanzando una petición por tipo en paralelo
 * y devolviendo el resultado combinado.
 */
export async function getAllFeatures(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
): Promise<MountainFeature[]> {

    const results = await Promise.all(
        FEATURE_TYPES.map((type) =>
            getFeatures(type, minLat, maxLat, minLon, maxLon)
        )
    )

    return results.flat()
}


export async function searchFeatures(
    name: string,
    type?: FeatureType
): Promise<MountainFeature[]> {

    const params = new URLSearchParams({ name })

    if (type) {
        params.set('type', type)
    }

    const response = await fetch(
        `${API_URL}/osm/features/search?${params.toString()}`
    )

    if (!response.ok) {
        throw new Error(
            'Error buscando elementos'
        )
    }

    return response.json()
}