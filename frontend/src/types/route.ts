/*
 * ============================================
 * SECCIÓN CRÍTICA
 * ============================================
 */

export const ROUTE_CRITICAL_SECTIONS = [
    'Pista',
    'Sendero/Corriol',
    'Tartera',
    'Roca vertical',
    'Roca vertical aérea',
] as const

export type RouteCriticalSection = typeof ROUTE_CRITICAL_SECTIONS[number]


/*
 * ============================================
 * PUNTO DEL TRAZADO
 * ============================================
 */

export interface RoutePoint {
    latitude: number
    longitude: number
}

export const ROUTE_DIFFICULTIES = [
    'Muy fácil',
    'Fácil',
    'Moderada',
    'Difícil',
    'Muy difícil',
] as const

export type RouteDifficulty =
    (typeof ROUTE_DIFFICULTIES)[number]

export interface RouteSegment {
    id: string

    name: string

    from: RoutePoint

    to: RoutePoint

    routingShape: RoutePoint[]

    distanceMeters: number | null

    durationSeconds: number | null

    difficulty: RouteDifficulty

    criticalSection: RouteCriticalSection

    personalRecommendations?: string | null

    featureIds: string[]
}

export interface CreateRouteSegment {
    id: string
    name: string
    from: RoutePoint
    to: RoutePoint
    distanceMeters: number | null
    durationSeconds: number | null
    difficulty: RouteDifficulty
    criticalSection: RouteCriticalSection
    personalRecommendations: string | null
    featureIds: string[]
}

/*
 * ============================================
 * DATOS QUE INTRODUCE EL USUARIO
 * ============================================
 *
 * CreateMountainRoute y UpdateMountainRoute son
 * iguales por ahora, así que comparten esta base.
 * Si en el futuro se separan (p. ej. Update permite
 * campos parciales), se rompe el alias y cada una
 * define lo suyo.
 */

export interface MountainRouteInput {
    name: string

    distanceKm: number

    elevationGain: number

    totalTimeMinutes: number

    movingTimeMinutes: number

    criticalSection: RouteCriticalSection

    personalRecommendations?: string | null

    track: RoutePoint[]

    segments: CreateRouteSegment[]
}

export type CreateMountainRoute = MountainRouteInput

export type UpdateMountainRoute = MountainRouteInput


/*
 * ============================================
 * RUTA COMPLETA (DEVUELTA POR EL BACKEND)
 * ============================================
 *
 * Añade el id, los campos calculados automáticamente
 * a partir de CriticalSection, y los timestamps.
 */

export interface MountainRoute extends MountainRouteInput {
    id: string

    generalDifficulty: string

    technique: string

    aerialExposure: string

    notRecommendedFor?: string | null

    recommendedMaterial?: string | null

    createdAt: string

    updatedAt: string
}