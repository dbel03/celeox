import type { MountainFeature } from '../types/mountain'

export type { MountainFeature }


const API_URL = '/api'


/*
 * ============================================
 * TIPOS DE FEATURES
 * ============================================
 */

/*
 * Lista de tipos de elemento que existen en el mapa.
 * Debe coincidir con SupportedTypes / TypeTagMap
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
 * FeatureType es un tipo "unión de literales" derivado
 * de FEATURE_TYPES.
 */
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
 *
 * Si se indica type, limita la búsqueda
 * a ese tipo de feature.
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

/*
 * Imagen de una MountainFeature.
 *
 * La URL es temporal porque el bucket de
 * Backblaze B2 es privado.
 */
export interface MountainImage {
    id: string
    imageKey: string
    url: string
    fileName: string
}

/*
 * Respuesta del backend al solicitar
 * todas las imágenes de una feature.
 *
 * GET /api/images/{id}
 *
 * El backend devuelve un array de imágenes.
 */
export type GetImagesResponse =
    MountainImage[]


/*
 * ============================================
 * OBTENER IMÁGENES
 * ============================================
 */

/*
 * Obtiene todas las imágenes de una feature.
 *
 * GET /api/images/{id}
 *
 * Devuelve las URLs temporales de Backblaze.
 */
export async function getImages(
    id: string
): Promise<MountainImage[]> {

    const response = await fetch(
        `${API_URL}/images/${encodeURIComponent(id)}`
    )

    if (!response.ok) {

        /*
         * Si la feature no tiene imágenes,
         * el backend puede devolver 404.
         *
         * Lo convertimos en un array vacío
         * para simplificar el frontend.
         */
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

    /*
     * El backend debería devolver directamente
     * un array.
     */
    return result
}


/*
 * ============================================
 * SUBIR IMAGEN
 * ============================================
 */

/*
 * Sube una nueva imagen para una feature.
 *
 * POST /api/images/{id}
 *
 * El backend recibe multipart/form-data
 * con el campo "file".
 *
 * IMPORTANTE:
 *
 * Esta función NO elimina las imágenes anteriores.
 * Permite tener varias imágenes por feature.
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

/*
 * Elimina UNA imagen concreta.
 *
 * DELETE /api/images/{id}/{imageKey}
 *
 * El imageKey identifica el objeto concreto
 * dentro de Backblaze B2.
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