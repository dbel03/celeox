import type { MountainFeature } from '../types/mountain'

export type { MountainFeature }


const API_URL = '/api'


/*
 * ============================================
 * TIPOS DE FEATURES
 * ============================================
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

export type FeatureType =
    typeof FEATURE_TYPES[number]


/*
 * ============================================
 * MAPA
 * ============================================
 */

export async function getMap() {

    const response = await fetch(
        `${API_URL}/map`
    )

    if (!response.ok) {
        throw new Error(
            `Error de API: ${response.status}`
        )
    }

    return response.json()
}


/*
 * ============================================
 * FEATURES
 * ============================================
 */

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
        throw new Error(
            `Error de API: ${response.status}`
        )
    }

    return response.json()
}


/*
 * Carga TODOS los tipos a la vez para un área.
 */

export async function getAllFeatures(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
): Promise<MountainFeature[]> {

    const results = await Promise.all(
        FEATURE_TYPES.map((type) =>
            getFeatures(
                type,
                minLat,
                maxLat,
                minLon,
                maxLon
            )
        )
    )

    return results.flat()
}


/*
 * Busca features por nombre.
 */

export async function searchFeatures(
    name: string,
    type?: FeatureType
): Promise<MountainFeature[]> {

    const params = new URLSearchParams({
        name,
    })

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


/*
 * ============================================
 * IMÁGENES
 * ============================================
 */

export interface MountainImage {
    id: string
    imageKey: string
    url: string
    fileName: string
}

export type GetImagesResponse =
    MountainImage[]


/*
 * ============================================
 * OBTENER IMÁGENES
 * ============================================
 */

export async function getImages(
    id: string
): Promise<MountainImage[]> {

    const response = await fetch(
        `${API_URL}/images/${encodeURIComponent(id)}`
    )

    if (!response.ok) {

        if (response.status === 404) {
            return []
        }

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error obteniendo imágenes: ${response.status}`
        )
    }

    const result =
        await response.json()

    return result
}


/*
 * ============================================
 * SUBIR IMAGEN
 * ============================================
 */

export async function uploadImage(
    id: string,
    file: File
): Promise<MountainImage> {

    const formData = new FormData()

    formData.append(
        'file',
        file
    )

    const response = await fetch(
        `${API_URL}/images/${encodeURIComponent(id)}`,
        {
            method: 'POST',
            body: formData,
        }
    )

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error subiendo la imagen: ${response.status}`
        )
    }

    return response.json()
}


/*
 * ============================================
 * ELIMINAR IMAGEN
 * ============================================
 */

export async function deleteImage(
    id: string,
    imageKey: string
): Promise<void> {

    const response = await fetch(
        `${API_URL}/images/${encodeURIComponent(id)}/${encodeURIComponent(imageKey)}`,
        {
            method: 'DELETE',
        }
    )

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error eliminando la imagen: ${response.status}`
        )
    }
}


/*
 * ============================================
 * RUTAS
 * ============================================
 */


/*
 * ============================================
 * OPCIONES DE RUTAS
 * ============================================
 */

export const ROUTE_CRITICAL_SECTIONS = [
    'Pista',
    'Sendero/Corriol',
    'Tartera',
    'Roca vertical',
    'Roca vertical aérea',
] as const

export type RouteCriticalSection =
    typeof ROUTE_CRITICAL_SECTIONS[number]


/*
 * Punto del trazado de una ruta.
 */

export interface RoutePoint {
    latitude: number
    longitude: number
}


/*
 * Ruta completa devuelta por el backend.
 */

export interface MountainRoute {
    name: string

    distanceKm: number

    elevationGain: number

    totalTimeMinutes: number

    movingTimeMinutes: number

    criticalSection: RouteCriticalSection

    personalRecommendations?: string | null

    track: RoutePoint[]
}


/*
 * Datos necesarios para crear una ruta.
 */

export interface CreateMountainRoute {
    name: string

    distanceKm: number

    elevationGain: number

    totalTimeMinutes: number

    movingTimeMinutes: number

    criticalSection: RouteCriticalSection

    personalRecommendations?: string | null

    track: RoutePoint[]
}


/*
 * Datos necesarios para actualizar una ruta.
 */

export interface UpdateMountainRoute {
    name: string

    distanceKm: number

    elevationGain: number

    totalTimeMinutes: number

    movingTimeMinutes: number

    criticalSection: RouteCriticalSection

    personalRecommendations?: string | null

    track: RoutePoint[]
}


/*
 * ============================================
 * FEATURES CERCANAS AL TRACK
 * ============================================
 */

/*
 * Obtiene las MountainFeatures que se encuentran
 * cerca del recorrido de una ruta.
 *
 * POST /api/MountainRoutes/FeaturesAlongTrack
 *
 * El backend utiliza actualmente un radio
 * por defecto de 100 metros.
 */

export async function getFeaturesAlongTrack(
    track: RoutePoint[]
): Promise<MountainFeature[]> {

    const response = await fetch(
        `${API_URL}/MountainRoutes/FeaturesAlongTrack`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(track),
        }
    )

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error obteniendo features de la ruta: ${response.status}`
        )
    }

    return response.json()
}


/*
 * ============================================
 * OBTENER TODAS LAS RUTAS
 * ============================================
 */

export async function getRoutes(): Promise<MountainRoute[]> {

    const response = await fetch(
        `${API_URL}/MountainRoutes`
    )

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error obteniendo las rutas: ${response.status}`
        )
    }

    return response.json()
}


/*
 * ============================================
 * OBTENER UNA RUTA
 * ============================================
 */

export async function getRoute(
    id: string
): Promise<MountainRoute> {

    const response = await fetch(
        `${API_URL}/MountainRoutes/${encodeURIComponent(id)}`
    )

    if (!response.ok) {

        if (response.status === 404) {
            throw new Error(
                'Ruta no encontrada'
            )
        }

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error obteniendo la ruta: ${response.status}`
        )
    }

    return response.json()
}


/*
 * ============================================
 * CREAR RUTA
 * ============================================
 */

export async function createRoute(
    route: CreateMountainRoute
): Promise<MountainRoute> {

    const response = await fetch(
        `${API_URL}/MountainRoutes`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(route),
        }
    )

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error creando la ruta: ${response.status}`
        )
    }

    return response.json()
}


/*
 * ============================================
 * ACTUALIZAR RUTA
 * ============================================
 */

export async function updateRoute(
    id: string,
    route: UpdateMountainRoute
): Promise<void> {

    const response = await fetch(
        `${API_URL}/MountainRoutes/${encodeURIComponent(id)}`,
        {
            method: 'PUT',

            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(route),
        }
    )

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error actualizando la ruta: ${response.status}`
        )
    }
}


/*
 * ============================================
 * ELIMINAR RUTA
 * ============================================
 */

export async function deleteRoute(
    id: string
): Promise<void> {

    const response = await fetch(
        `${API_URL}/MountainRoutes/${encodeURIComponent(id)}`,
        {
            method: 'DELETE',
        }
    )

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Error eliminando la ruta: ${response.status}`
        )
    }
}