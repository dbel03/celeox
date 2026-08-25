import { useCallback, useState } from 'react'
import type { SyntheticEvent } from 'react'
import {
    MapContainer,
    TileLayer,
    Polyline,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import RouteDrawing from '../components/map/RouteDrawing'

import {
    createRoute,
    getFeaturesAlongTrack,
    calculateRoute,
} from '../services/api'

import type {
    MountainFeature,
} from '../services/api'

import type {
    RoutePoint,
    CreateMountainRoute,
    RouteCriticalSection,
} from '../types/route'

import {
    ROUTE_CRITICAL_SECTIONS,
} from '../types/route'

const catalunyaCenter: [number, number] = [
    41.7,
    1.75,
]

/*
 * =========================================================
 * TIPOS
 * =========================================================
 */

type RouteDifficulty =
    | 'Muy fácil'
    | 'Fácil'
    | 'Moderada'
    | 'Difícil'
    | 'Muy difícil'

const ROUTE_DIFFICULTIES: RouteDifficulty[] = [
    'Muy fácil',
    'Fácil',
    'Moderada',
    'Difícil',
    'Muy difícil',
]

interface RouteSegment {
    id: string

    points: RoutePoint[]

    /*
     * Ruta calculada por Itinero.
     * Puede ser diferente al dibujo original.
     */
    routingShape: RoutePoint[]

    distanceMeters: number | null

    durationSeconds: number | null

    difficulty: RouteDifficulty

    criticalSection: RouteCriticalSection

    personalRecommendations: string

    /*
     * IDs de elementos encontrados
     * alrededor de este tramo.
     */
    featureIds: string[]

    /*
     * Elementos completos para mostrarlos
     * en la interfaz durante la edición.
     */
    features: MountainFeature[]

    routingLoading: boolean

    nearbyLoading: boolean

    error: string | null
}

interface RouteFormState {
    name: string
    distanceKm: string
    elevationGain: string
    totalTimeMinutes: string
    movingTimeMinutes: string
    criticalSection: RouteCriticalSection
    personalRecommendations: string
}

const initialForm: RouteFormState = {
    name: '',
    distanceKm: '',
    elevationGain: '',
    totalTimeMinutes: '',
    movingTimeMinutes: '',
    criticalSection: ROUTE_CRITICAL_SECTIONS[0],
    personalRecommendations: '',
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function createSegmentId() {
    return `segment-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

function CreateRoutePage() {
    /*
     * =====================================================
     * ESTADO GENERAL
     * =====================================================
     */

    const [drawing, setDrawing] =
        useState(true)

    /*
     * Puntos del tramo que estamos dibujando
     * actualmente.
     */
    const [currentPoints, setCurrentPoints] =
        useState<RoutePoint[]>([])

    /*
     * Tramos ya terminados.
     */
    const [segments, setSegments] =
        useState<RouteSegment[]>([])

    /*
     * Tramo seleccionado para editar/borrar.
     */
    const [selectedSegmentId, setSelectedSegmentId] =
        useState<string | null>(null)

    /*
     * Modo goma mágica.
     */
    const [eraserMode, setEraserMode] =
        useState(false)

    /*
     * =====================================================
     * FORMULARIO GENERAL
     * =====================================================
     */

    const [form, setForm] =
        useState<RouteFormState>(initialForm)

    const [saving, setSaving] =
        useState(false)

    const [saveError, setSaveError] =
        useState<string | null>(null)

    const [savedRouteName, setSavedRouteName] =
        useState<string | null>(null)

    /*
     * =====================================================
     * DATOS DERIVADOS
     * =====================================================
     */

    const totalPoints =
        segments.reduce(
            (total, segment) =>
                total + segment.points.length,
            currentPoints.length
        )

    const totalDistanceMeters =
        segments.reduce(
            (total, segment) =>
                total +
                (segment.distanceMeters ?? 0),
            0
        )

    const totalDurationSeconds =
        segments.reduce(
            (total, segment) =>
                total +
                (segment.durationSeconds ?? 0),
            0
        )

    const allFeatureIds = Array.from(
        new Set(
            segments.flatMap(
                (segment) =>
                    segment.featureIds
            )
        )
    )

    /*
     * =====================================================
     * FORM
     * =====================================================
     */

    const handleFieldChange = <
        K extends keyof RouteFormState
    >(
        field: K,
        value: RouteFormState[K]
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    /*
     * =====================================================
     * DIBUJO
     * =====================================================
     */

    const handleUndo = useCallback(() => {
        setCurrentPoints(
            (previous) =>
                previous.slice(0, -1)
        )
    }, [])

    const handleClearCurrent = useCallback(() => {
        setCurrentPoints([])
    }, [])

    /*
     * =====================================================
     * CREAR TRAMO
     *
     * El usuario termina un tramo.
     *
     * Automáticamente:
     *
     * 1. Se crea el tramo.
     * 2. Se llama a Itinero.
     * 3. Se buscan elementos cercanos.
     * 4. Se guardan sus IDs en memoria.
     * =====================================================
     */

    const finishCurrentSegment = useCallback(
        async () => {
            if (
                currentPoints.length < 2
            ) {
                return
            }

            const points =
                [...currentPoints]

            const segmentId =
                createSegmentId()

            /*
             * Crear inmediatamente el tramo
             * para que aparezca en pantalla.
             */
            const newSegment: RouteSegment = {
                id: segmentId,

                points,

                routingShape: [],

                distanceMeters: null,

                durationSeconds: null,

                difficulty: 'Moderada',

                criticalSection:
                    ROUTE_CRITICAL_SECTIONS[0],

                personalRecommendations:
                    '',

                featureIds: [],

                features: [],

                routingLoading: true,

                nearbyLoading: true,

                error: null,
            }

            setSegments(
                (previous) => [
                    ...previous,
                    newSegment,
                ]
            )

            /*
             * Limpiamos el dibujo actual.
             * Ahora se puede dibujar el siguiente tramo.
             */
            setCurrentPoints([])

            setDrawing(true)

            /*
             * =============================================
             * ITINERO
             * =============================================
             */

            try {
                const from =
                    points[0]

                const to =
                    points[
                        points.length - 1
                    ]

                const routing =
                    await calculateRoute(
                        from,
                        to
                    )

                setSegments(
                    (previous) =>
                        previous.map(
                            (segment) =>
                                segment.id ===
                                segmentId
                                    ? {
                                          ...segment,

                                          routingShape:
                                              routing.shape,

                                          distanceMeters:
                                              routing.distanceMeters,

                                          durationSeconds:
                                              routing.durationSeconds,

                                          routingLoading:
                                              false,
                                      }
                                    : segment
                        )
                )
            } catch (error) {
                console.error(
                    'Error ejecutando Itinero:',
                    error
                )

                setSegments(
                    (previous) =>
                        previous.map(
                            (segment) =>
                                segment.id ===
                                segmentId
                                    ? {
                                          ...segment,

                                          routingLoading:
                                              false,

                                          error:
                                              error instanceof
                                              Error
                                                  ? error.message
                                                  : 'Error ejecutando Itinero.',
                                      }
                                    : segment
                        )
                )
            }

            /*
             * =============================================
             * ELEMENTOS CERCANOS
             * =============================================
             */

            try {
                const features =
                    await getFeaturesAlongTrack(
                        points
                    )

                const featureIds =
                    features.map(
                        (feature) =>
                            feature.id
                    )

                setSegments(
                    (previous) =>
                        previous.map(
                            (segment) =>
                                segment.id ===
                                segmentId
                                    ? {
                                          ...segment,

                                          features,

                                          featureIds,

                                          nearbyLoading:
                                              false,
                                      }
                                    : segment
                        )
                )
            } catch (error) {
                console.error(
                    'Error buscando elementos:',
                    error
                )

                setSegments(
                    (previous) =>
                        previous.map(
                            (segment) =>
                                segment.id ===
                                segmentId
                                    ? {
                                          ...segment,

                                          nearbyLoading:
                                              false,

                                          error:
                                              error instanceof
                                              Error
                                                  ? error.message
                                                  : 'Error buscando elementos cercanos.',
                                      }
                                    : segment
                        )
                )
            }
        },
        [currentPoints]
    )

    /*
     * =====================================================
     * SELECCIONAR TRAMO
     * =====================================================
     */

    const handleSelectSegment =
        useCallback(
            (segmentId: string) => {
                setSelectedSegmentId(
                    segmentId
                )
            },
            []
        )

    /*
     * =====================================================
     * GOMA MÁGICA
     *
     * Borra el tramo completo seleccionado.
     * =====================================================
     */

    const handleDeleteSegment =
        useCallback(() => {
            if (
                !selectedSegmentId
            ) {
                return
            }

            setSegments(
                (previous) =>
                    previous.filter(
                        (segment) =>
                            segment.id !==
                            selectedSegmentId
                    )
            )

            setSelectedSegmentId(null)

            setEraserMode(false)
        }, [selectedSegmentId])

    /*
     * =====================================================
     * ACTUALIZAR OPCIONES DEL TRAMO
     * =====================================================
     */

    const updateSelectedSegment =
        useCallback(
            (
                changes: Partial<RouteSegment>
            ) => {
                if (
                    !selectedSegmentId
                ) {
                    return
                }

                setSegments(
                    (previous) =>
                        previous.map(
                            (segment) =>
                                segment.id ===
                                selectedSegmentId
                                    ? {
                                          ...segment,
                                          ...changes,
                                      }
                                    : segment
                        )
                )
            },
            [selectedSegmentId]
        )

    const selectedSegment =
        segments.find(
            (segment) =>
                segment.id ===
                selectedSegmentId
        ) ?? null

    /*
     * =====================================================
     * BORRAR TODO
     * =====================================================
     */

    const handleClearAll =
        useCallback(() => {
            setCurrentPoints([])

            setSegments([])

            setSelectedSegmentId(null)

            setEraserMode(false)

            setSavedRouteName(null)

            setSaveError(null)
        }, [])

    /*
     * =====================================================
     * SALIR DEL MODO EDICIÓN
     * =====================================================
     */

    const handleExitEditor =
        useCallback(() => {
            /*
             * De momento volvemos a la pantalla
             * anterior mediante history.
             *
             * Si luego quieres navegación React Router,
             * aquí metemos navigate(-1).
             */
            window.history.back()
        }, [])

    /*
     * =====================================================
     * GUARDAR RUTA
     * =====================================================
     */

    const submitRoute = () => {
        if (
            segments.length === 0 &&
            currentPoints.length < 2
        ) {
            setSaveError(
                'Dibuja al menos un tramo antes de guardar la ruta.'
            )

            return
        }

        /*
         * Si queda un dibujo sin terminar,
         * avisamos al usuario.
         */
        if (
            currentPoints.length >= 2
        ) {
            setSaveError(
                'Tienes un tramo sin terminar. Termínalo antes de guardar la ruta.'
            )

            return
        }

        /*
         * Para mantener compatibilidad con
         * tu CreateMountainRoute actual,
         * juntamos los puntos de todos los tramos.
         *
         * Después ampliaremos el backend para enviar
         * directamente "segments".
         */
        const track =
            segments.flatMap(
                (segment) =>
                    segment.points
            )

        const payload: CreateMountainRoute = {
            name:
                form.name.trim(),

            distanceKm:
                Number(
                    form.distanceKm
                ) ||
                totalDistanceMeters /
                    1000,

            elevationGain:
                Number(
                    form.elevationGain
                ),

            totalTimeMinutes:
                Number(
                    form.totalTimeMinutes
                ) ||
                Math.round(
                    totalDurationSeconds /
                        60
                ),

            movingTimeMinutes:
                Number(
                    form.movingTimeMinutes
                ),

            criticalSection:
                form.criticalSection,

            personalRecommendations:
                form.personalRecommendations
                    .trim() ||
                null,

            track,
        }

        setSaving(true)

        setSaveError(null)

        createRoute(payload)
            .then((created) => {
                setSavedRouteName(
                    created.name
                )

                setForm(
                    initialForm
                )

                setCurrentPoints([])

                setSegments([])

                setSelectedSegmentId(
                    null
                )

                setDrawing(true)
            })
            .catch((error) => {
                console.error(
                    'Error creando la ruta:',
                    error
                )

                setSaveError(
                    error instanceof
                        Error
                        ? error.message
                        : 'Error creando la ruta.'
                )
            })
            .finally(() =>
                setSaving(false)
            )
    }

    const handleSubmit = (
        event: SyntheticEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        submitRoute()
    }

    /*
     * =====================================================
     * RENDER
     * =====================================================
     */

    return (
        <div className="flex h-full w-full flex-col sm:flex-row">

            {/* =================================================
                MAPA
            ================================================= */}

            <div className="relative h-64 w-full sm:h-full sm:flex-1">

                <MapContainer
                    center={
                        catalunyaCenter
                    }
                    zoom={13}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* =========================================
                        DIBUJO ACTUAL
                    ========================================= */}

                    <RouteDrawing
                        active={
                            drawing &&
                            !eraserMode
                        }
                        points={
                            currentPoints
                        }
                        onChange={
                            setCurrentPoints
                        }
                    />

                    {/* =========================================
                        TRAMOS YA CREADOS
                    ========================================= */}

                    {segments.map(
                        (segment) => {
                            const positions =
                                segment.points.map(
                                    (
                                        point
                                    ) =>
                                        [
                                            point.latitude,
                                            point.longitude,
                                        ] as [
                                            number,
                                            number
                                        ]
                                )

                            const isSelected =
                                segment.id ===
                                selectedSegmentId

                            return (
                                <Polyline
                                    key={
                                        segment.id
                                    }
                                    positions={
                                        positions
                                    }
                                    pathOptions={{
                                        color:
                                            isSelected
                                                ? '#2563eb'
                                                : '#111827',

                                        weight:
                                            isSelected
                                                ? 8
                                                : 5,

                                        opacity:
                                            isSelected
                                                ? 1
                                                : 0.8,
                                    }}
                                    eventHandlers={{
                                        click:
                                            () => {
                                                handleSelectSegment(
                                                    segment.id
                                                )
                                            },
                                    }}
                                />
                            )
                        }
                    )}

                    {/* =========================================
                        RUTAS CALCULADAS POR ITINERO
                    ========================================= */}

                    {segments.map(
                        (segment) =>
                            segment
                                .routingShape
                                .length >
                                1 && (
                                <Polyline
                                    key={`routing-${segment.id}`}
                                    positions={segment.routingShape.map(
                                        (
                                            point
                                        ) =>
                                            [
                                                point.latitude,
                                                point.longitude,
                                            ] as [
                                                number,
                                                number
                                            ]
                                    )}
                                    pathOptions={{
                                        color:
                                            '#ef4444',

                                        weight: 4,

                                        opacity: 0.75,

                                        dashArray:
                                            '8 8',
                                    }}
                                />
                            )
                    )}
                </MapContainer>

                {/* =================================================
                    BARRA DE HERRAMIENTAS
                ================================================= */}

                <div className="absolute left-4 right-4 top-4 z-[1000] flex flex-wrap items-center gap-2">

                    {/* SALIR */}

                    <button
                        type="button"
                        onClick={
                            handleExitEditor
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg font-bold shadow"
                        title="Salir"
                    >
                        ×
                    </button>

                    {/* DIBUJAR */}

                    <button
                        type="button"
                        onClick={() => {
                            setEraserMode(
                                false
                            )

                            setDrawing(
                                true
                            )
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold shadow ${
                            drawing &&
                            !eraserMode
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-800'
                        }`}
                    >
                        ✏️ Dibujar tramo
                    </button>

                    {/* TERMINAR */}

                    {currentPoints.length >=
                        2 && (
                        <button
                            type="button"
                            onClick={
                                finishCurrentSegment
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow"
                        >
                            ✓ Terminar tramo
                        </button>
                    )}

                    {/* DESHACER */}

                    <button
                        type="button"
                        onClick={
                            handleUndo
                        }
                        disabled={
                            currentPoints.length ===
                            0
                        }
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow disabled:opacity-50"
                    >
                        ↶
                    </button>

                    {/* GOMA */}

                    <button
                        type="button"
                        onClick={() =>
                            setEraserMode(
                                (active) =>
                                    !active
                            )
                        }
                        disabled={
                            segments.length ===
                            0
                        }
                        className={`rounded-lg px-3 py-2 text-sm font-semibold shadow ${
                            eraserMode
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-800'
                        } disabled:opacity-50`}
                    >
                        🧽 Goma
                    </button>

                    {/* BORRAR TODO */}

                    <button
                        type="button"
                        onClick={
                            handleClearAll
                        }
                        disabled={
                            segments.length ===
                                0 &&
                            currentPoints.length ===
                                0
                        }
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow disabled:opacity-50"
                    >
                        Borrar todo
                    </button>
                </div>

                {/* =================================================
                    MENSAJE GOMA
                ================================================= */}

                {eraserMode && (
                    <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                        Selecciona un tramo para eliminarlo
                    </div>
                )}
            </div>

            {/* =================================================
                PANEL DERECHO
            ================================================= */}

            <div className="w-full overflow-y-auto border-t border-gray-200 bg-white p-4 sm:h-full sm:w-96 sm:border-l sm:border-t-0">

                <div className="flex items-start justify-between gap-3">

                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Nueva ruta
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {segments.length}{' '}
                            tramo
                            {segments.length ===
                            1
                                ? ''
                                : 's'}
                            {' · '}
                            {totalPoints}{' '}
                            puntos
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            handleExitEditor
                        }
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        ← Volver
                    </button>
                </div>

                {/* =================================================
                    RESUMEN
                ================================================= */}

                {segments.length >
                    0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">

                        <div className="rounded-lg bg-gray-50 p-3">
                            <div className="text-xs text-gray-500">
                                Distancia
                            </div>

                            <div className="mt-1 font-bold text-gray-800">
                                {(
                                    totalDistanceMeters /
                                    1000
                                ).toFixed(2)}{' '}
                                km
                            </div>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                            <div className="text-xs text-gray-500">
                                Tiempo
                            </div>

                            <div className="mt-1 font-bold text-gray-800">
                                {Math.round(
                                    totalDurationSeconds /
                                        60
                                )}{' '}
                                min
                            </div>
                        </div>

                        <div className="col-span-2 rounded-lg bg-gray-50 p-3">
                            <div className="text-xs text-gray-500">
                                Elementos encontrados
                            </div>

                            <div className="mt-1 font-bold text-gray-800">
                                {
                                    allFeatureIds.length
                                }
                            </div>
                        </div>
                    </div>
                )}

                {/* =================================================
                    TRAMOS
                ================================================= */}

                {segments.length >
                    0 && (
                    <div className="mt-5">

                        <h3 className="text-sm font-bold text-gray-800">
                            Tramos
                        </h3>

                        <div className="mt-2 space-y-2">

                            {segments.map(
                                (
                                    segment,
                                    index
                                ) => {
                                    const selected =
                                        segment.id ===
                                        selectedSegmentId

                                    return (
                                        <button
                                            key={
                                                segment.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                setSelectedSegmentId(
                                                    segment.id
                                                )
                                            }
                                            className={`w-full rounded-lg border p-3 text-left transition ${
                                                selected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">

                                                <span className="font-semibold text-gray-800">
                                                    Tramo{' '}
                                                    {index +
                                                        1}
                                                </span>

                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                                    {
                                                        segment.difficulty
                                                    }
                                                </span>
                                            </div>

                                            <div className="mt-2 text-xs text-gray-500">

                                                {segment.distanceMeters !==
                                                null
                                                    ? `${(
                                                          segment.distanceMeters /
                                                          1000
                                                      ).toFixed(
                                                          2
                                                      )} km`
                                                    : 'Calculando distancia...'}

                                                {' · '}

                                                {segment.nearbyLoading
                                                    ? 'Buscando elementos...'
                                                    : `${segment.featureIds.length} elementos`}
                                            </div>

                                            {segment.routingLoading && (
                                                <div className="mt-2 text-xs text-red-600">
                                                    🧭 Calculando camino...
                                                </div>
                                            )}
                                        </button>
                                    )
                                }
                            )}
                        </div>
                    </div>
                )}

                {/* =================================================
                    OPCIONES DEL TRAMO
                ================================================= */}

                {selectedSegment && (
                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3">

                        <div className="flex items-center justify-between">

                            <h3 className="font-bold text-gray-800">
                                Opciones del tramo
                            </h3>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedSegmentId(
                                        null
                                    )
                                }
                                className="text-lg text-gray-500"
                            >
                                ×
                            </button>
                        </div>

                        {/* DIFICULTAD */}

                        <label className="mt-3 flex flex-col gap-1 text-sm text-gray-700">
                            Dificultad

                            <select
                                value={
                                    selectedSegment.difficulty
                                }
                                onChange={(e) =>
                                    updateSelectedSegment(
                                        {
                                            difficulty:
                                                e.target.value as RouteDifficulty,
                                        }
                                    )
                                }
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                            >
                                {ROUTE_DIFFICULTIES.map(
                                    (
                                        difficulty
                                    ) => (
                                        <option
                                            key={
                                                difficulty
                                            }
                                            value={
                                                difficulty
                                            }
                                        >
                                            {
                                                difficulty
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </label>

                        {/* SECCIÓN CRÍTICA */}

                        <label className="mt-3 flex flex-col gap-1 text-sm text-gray-700">
                            Sección crítica

                            <select
                                value={
                                    selectedSegment.criticalSection
                                }
                                onChange={(e) =>
                                    updateSelectedSegment(
                                        {
                                            criticalSection:
                                                e.target.value as RouteCriticalSection,
                                        }
                                    )
                                }
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                            >
                                {ROUTE_CRITICAL_SECTIONS.map(
                                    (
                                        section
                                    ) => (
                                        <option
                                            key={
                                                section
                                            }
                                            value={
                                                section
                                            }
                                        >
                                            {
                                                section
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </label>

                        {/* RECOMENDACIONES */}

                        <label className="mt-3 flex flex-col gap-1 text-sm text-gray-700">
                            Recomendaciones

                            <textarea
                                value={
                                    selectedSegment.personalRecommendations
                                }
                                onChange={(e) =>
                                    updateSelectedSegment(
                                        {
                                            personalRecommendations:
                                                e.target.value,
                                        }
                                    )
                                }
                                rows={
                                    3
                                }
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                            />
                        </label>

                        {/* ELEMENTOS */}

                        <div className="mt-3 rounded-lg bg-white p-3">

                            <div className="flex justify-between text-sm">

                                <span className="text-gray-500">
                                    Elementos encontrados
                                </span>

                                <strong>
                                    {
                                        selectedSegment.featureIds
                                            .length
                                    }
                                </strong>
                            </div>

                            {selectedSegment.features
                                .length >
                                0 && (
                                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">

                                    {selectedSegment.features.map(
                                        (
                                            feature
                                        ) => (
                                            <li
                                                key={
                                                    feature.id
                                                }
                                                className="flex items-center justify-between text-xs text-gray-700"
                                            >
                                                <span>
                                                    {
                                                        feature.name
                                                    }
                                                </span>

                                                <span className="rounded bg-gray-100 px-1.5 py-0.5">
                                                    {
                                                        feature.type
                                                    }
                                                </span>
                                            </li>
                                        )
                                    )}

                                </ul>
                            )}

                        </div>

                        {/* BORRAR TRAMO */}

                        <button
                            type="button"
                            onClick={
                                handleDeleteSegment
                            }
                            className="mt-3 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow"
                        >
                            🧽 Eliminar este tramo
                        </button>
                    </div>
                )}

                {/* =================================================
                    FORMULARIO GENERAL
                ================================================= */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="mt-5 flex flex-col gap-3"
                >

                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-bold text-gray-800">
                            Información de la ruta
                        </h3>
                    </div>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Nombre

                        <input
                            type="text"
                            required
                            value={
                                form.name
                            }
                            onChange={(e) =>
                                handleFieldChange(
                                    'name',
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Distancia (km)

                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={
                                form.distanceKm
                            }
                            onChange={(e) =>
                                handleFieldChange(
                                    'distanceKm',
                                    e.target.value
                                )
                            }
                            placeholder={
                                totalDistanceMeters >
                                0
                                    ? (
                                          totalDistanceMeters /
                                          1000
                                      ).toFixed(
                                          2
                                      )
                                    : ''
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Desnivel positivo (m)

                        <input
                            type="number"
                            step="1"
                            min="0"
                            required
                            value={
                                form.elevationGain
                            }
                            onChange={(e) =>
                                handleFieldChange(
                                    'elevationGain',
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Tiempo total (min)

                        <input
                            type="number"
                            step="1"
                            min="0"
                            value={
                                form.totalTimeMinutes
                            }
                            onChange={(e) =>
                                handleFieldChange(
                                    'totalTimeMinutes',
                                    e.target.value
                                )
                            }
                            placeholder={
                                totalDurationSeconds >
                                0
                                    ? String(
                                          Math.round(
                                              totalDurationSeconds /
                                                  60
                                          )
                                      )
                                    : ''
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Tiempo en movimiento (min)

                        <input
                            type="number"
                            step="1"
                            min="0"
                            value={
                                form.movingTimeMinutes
                            }
                            onChange={(e) =>
                                handleFieldChange(
                                    'movingTimeMinutes',
                                    e.target.value
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Sección crítica general

                        <select
                            value={
                                form.criticalSection
                            }
                            onChange={(e) =>
                                handleFieldChange(
                                    'criticalSection',
                                    e.target.value as RouteCriticalSection
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        >
                            {ROUTE_CRITICAL_SECTIONS.map(
                                (
                                    section
                                ) => (
                                    <option
                                        key={
                                            section
                                        }
                                        value={
                                            section
                                        }
                                    >
                                        {
                                            section
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Recomendaciones generales

                        <textarea
                            value={
                                form.personalRecommendations
                            }
                            onChange={(e) =>
                                handleFieldChange(
                                    'personalRecommendations',
                                    e.target.value
                                )
                            }
                            rows={
                                3
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    {/* IDS QUE ACABAREMOS ENVIANDO AL BACKEND */}

                    {allFeatureIds.length >
                        0 && (
                        <div className="rounded-lg bg-gray-50 p-3">

                            <div className="text-xs font-semibold text-gray-700">
                                IDs de elementos detectados
                            </div>

                            <div className="mt-1 break-all text-[11px] text-gray-500">
                                {
                                    allFeatureIds.join(
                                        ', '
                                    )
                                }
                            </div>

                        </div>
                    )}

                    {saveError && (
                        <p className="text-sm text-red-600">
                            {saveError}
                        </p>
                    )}

                    {savedRouteName && (
                        <p className="text-sm text-emerald-700">
                            Ruta "
                            {
                                savedRouteName
                            }
                            " guardada correctamente.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={
                            saving ||
                            segments.length ===
                                0
                        }
                        className="mt-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                    >
                        {saving
                            ? 'Guardando...'
                            : 'Guardar ruta'}
                    </button>

                </form>
            </div>
        </div>
    )
}

export default CreateRoutePage
