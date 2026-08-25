import { useCallback, useState, Fragment } from 'react'
import type { SyntheticEvent } from 'react'

import {
    TileLayer,
    Polyline,
    CircleMarker,
    useMapEvents,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import {
    createRoute,
    getFeaturesAlongTrack,
    calculateRoute,
} from '../services/api'

import type { MountainFeature } from '../services/api'

import type {
    RoutePoint,
    CreateMountainRoute,
    RouteCriticalSection,
} from '../types/route'

import {
    ROUTE_CRITICAL_SECTIONS,
} from '../types/route'

import MapView from '../components/map/MapView'

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
    name: string
    from: RoutePoint
    to: RoutePoint
    routingShape: RoutePoint[]
    distanceMeters: number | null
    durationSeconds: number | null
    difficulty: RouteDifficulty
    criticalSection: RouteCriticalSection
    personalRecommendations: string
    featureIds: string[]
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
 * TOLERANCIA PARA CONSIDERAR DOS PUNTOS IGUALES
 * =========================================================
 *
 * Los puntos procedentes del mapa deberían coincidir
 * exactamente, pero usamos una pequeña tolerancia para
 * evitar problemas de precisión decimal.
 */

const POINT_EPSILON = 0.00001

function pointsAreEqual(
    first: RoutePoint,
    second: RoutePoint
) {
    return (
        Math.abs(
            first.latitude -
            second.latitude
        ) <= POINT_EPSILON &&
        Math.abs(
            first.longitude -
            second.longitude
        ) <= POINT_EPSILON
    )
}

function createSegmentId() {
    return `segment-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`
}

/*
 * =========================================================
 * MAP CLICK HANDLER
 * =========================================================
 */

interface MapClickHandlerProps {
    disabled: boolean
    onMapClick: (point: RoutePoint) => void
}

function MapClickHandler({
    disabled,
    onMapClick,
}: MapClickHandlerProps) {
    useMapEvents({
        click(event) {
            if (disabled) {
                return
            }

            onMapClick({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            })
        },
    })

    return null
}

/*
 * =========================================================
 * VALIDACIÓN DE CONTINUIDAD
 * =========================================================
 *
 * Una ruta válida puede ser:
 *
 * ABIERTA:
 *
 * A ---- B ---- C ---- D
 *
 * Tiene exactamente 2 extremos.
 *
 * CIRCULAR:
 *
 * A ---- B
 * |      |
 * D ---- C
 *
 * No tiene extremos.
 *
 * No permitimos:
 *
 * A ---- B
 *       |
 *       C
 *
 * porque eso crea una bifurcación.
 */

interface RouteGraphNode {
    point: RoutePoint
    degree: number
}

function getRouteGraph(
    segments: RouteSegment[]
) {
    const nodes: RouteGraphNode[] = []

    const getNode = (
        point: RoutePoint
    ) => {
        let node = nodes.find(
            (candidate) =>
                pointsAreEqual(
                    candidate.point,
                    point
                )
        )

        if (!node) {
            node = {
                point,
                degree: 0,
            }

            nodes.push(node)
        }

        return node
    }

    for (const segment of segments) {
        const fromNode =
            getNode(segment.from)

        const toNode =
            getNode(segment.to)

        /*
         * Un tramo normal aumenta un grado en cada extremo.
         *
         * Si es un bucle sobre sí mismo, ambos extremos
         * son el mismo nodo y el grado aumenta en 2.
         */
        fromNode.degree += 1
        toNode.degree += 1
    }

    return nodes
}

function validateRouteContinuity(
    segments: RouteSegment[]
): string | null {
    if (segments.length === 0) {
        return 'No hay tramos para guardar.'
    }

    /*
     * =============================================
     * COMPROBAR QUE TODOS LOS TRAMOS ESTÁN CONECTADOS
     * =============================================
     */

    const visited = new Set<string>()

    const firstSegment =
        segments[0]

    const queue: RoutePoint[] = [
        firstSegment.from,
        firstSegment.to,
    ]

    const pointKey = (
        point: RoutePoint
    ) =>
        `${point.latitude.toFixed(7)},${point.longitude.toFixed(7)}`

    while (queue.length > 0) {
        const current =
            queue.shift()!

        const key =
            pointKey(current)

        if (visited.has(key)) {
            continue
        }

        visited.add(key)

        for (const segment of segments) {
            if (
                pointsAreEqual(
                    segment.from,
                    current
                )
            ) {
                queue.push(segment.to)
            }

            if (
                pointsAreEqual(
                    segment.to,
                    current
                )
            ) {
                queue.push(segment.from)
            }
        }
    }

    const disconnectedSegment =
        segments.find(
            (segment) =>
                !visited.has(
                    pointKey(
                        segment.from
                    )
                ) &&
                !visited.has(
                    pointKey(
                        segment.to
                    )
                )
        )

    if (disconnectedSegment) {
        return (
            'Los tramos no forman una ruta continua. ' +
            'Conecta todos los tramos antes de guardar.'
        )
    }

    /*
     * =============================================
     * COMPROBAR EXTREMOS
     * =============================================
     */

    const nodes =
        getRouteGraph(segments)

    const endpoints =
        nodes.filter(
            (node) =>
                node.degree === 1
        )

    const invalidNode =
        nodes.find(
            (node) =>
                node.degree > 2
        )

    /*
     * Una ruta lineal debe tener exactamente
     * dos extremos.
     *
     * Una ruta circular debe tener cero.
     */

    if (invalidNode) {
        return (
            'La ruta contiene una bifurcación. ' +
            'Todos los tramos deben formar un único recorrido, ' +
            'sin ramas.'
        )
    }

    if (
        endpoints.length !== 0 &&
        endpoints.length !== 2
    ) {
        return (
            'Los tramos no forman un recorrido continuo. ' +
            'Comprueba que todos los puntos estén unidos.'
        )
    }

    return null
}

/*
 * =========================================================
 * ORDENAR TRAMOS SEGÚN EL RECORRIDO
 * =========================================================
 *
 * Esto es importante porque el usuario puede crear los
 * tramos en un orden que no coincida con el orden real
 * de la ruta.
 *
 * El backend recibirá siempre:
 *
 * A -> B -> C -> D
 *
 * aunque el usuario haya creado:
 *
 * B -> C
 * D -> C
 * A -> B
 */

function orderSegmentsForTrack(
    segments: RouteSegment[]
): RouteSegment[] {
    if (segments.length <= 1) {
        return [...segments]
    }

    const nodes =
        getRouteGraph(segments)

    const endpoints =
        nodes.filter(
            (node) =>
                node.degree === 1
        )

    /*
     * Si es una ruta abierta empezamos en uno de
     * los extremos.
     *
     * Si es circular podemos empezar en cualquier
     * punto.
     */

    let currentPoint: RoutePoint

    if (endpoints.length === 2) {
        currentPoint =
            endpoints[0].point
    } else {
        currentPoint =
            segments[0].from
    }

    const remaining =
        new Set(
            segments.map(
                (segment) =>
                    segment.id
            )
        )

    const ordered: RouteSegment[] = []

    while (
        remaining.size > 0
    ) {
        const nextSegment =
            segments.find(
                (segment) =>
                    remaining.has(
                        segment.id
                    ) &&
                    (
                        pointsAreEqual(
                            segment.from,
                            currentPoint
                        ) ||
                        pointsAreEqual(
                            segment.to,
                            currentPoint
                        )
                    )
            )

        /*
         * No debería suceder si la validación de
         * continuidad ha pasado, pero dejamos una
         * protección adicional.
         */

        if (!nextSegment) {
            break
        }

        ordered.push(
            nextSegment
        )

        remaining.delete(
            nextSegment.id
        )

        if (
            pointsAreEqual(
                nextSegment.from,
                currentPoint
            )
        ) {
            currentPoint =
                nextSegment.to
        } else {
            currentPoint =
                nextSegment.from
        }
    }

    /*
     * Si por alguna razón no hemos podido ordenar
     * todos los segmentos, devolvemos el orden
     * original. La validación será la encargada
     * de impedir guardar una ruta incorrecta.
     */

    if (
        ordered.length !==
        segments.length
    ) {
        return [...segments]
    }

    return ordered
}

function buildContinuousTrack(
    segments: RouteSegment[]
): RoutePoint[] {
    const ordered =
        orderSegmentsForTrack(
            segments
        )

    if (
        ordered.length === 0
    ) {
        return []
    }

    const track: RoutePoint[] = []

    let currentPoint =
        ordered[0].from

    /*
     * Orientamos el primer tramo.
     */

    let firstShape =
        ordered[0].routingShape

    if (
        firstShape.length > 1 &&
        !pointsAreEqual(
            ordered[0].from,
            currentPoint
        )
    ) {
        firstShape =
            [...firstShape].reverse()
    }

    track.push(
        ...firstShape
    )

    currentPoint =
        ordered[0].to

    /*
     * Los siguientes segmentos se orientan según
     * el punto donde termina el anterior.
     */

    for (
        let index = 1;
        index < ordered.length;
        index++
    ) {
        const segment =
            ordered[index]

        let shape =
            segment.routingShape

        if (
            pointsAreEqual(
                segment.to,
                currentPoint
            )
        ) {
            shape =
                [...shape].reverse()
        }

        /*
         * Evitamos duplicar el punto de unión.
         */

        if (
            shape.length > 0 &&
            track.length > 0 &&
            pointsAreEqual(
                track[track.length - 1],
                shape[0]
            )
        ) {
            track.push(
                ...shape.slice(1)
            )
        } else {
            track.push(
                ...shape
            )
        }

        if (
            pointsAreEqual(
                segment.from,
                currentPoint
            )
        ) {
            currentPoint =
                segment.to
        } else {
            currentPoint =
                segment.from
        }
    }

    return track
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

function CreateRoutePage() {
    const [segments, setSegments] =
        useState<RouteSegment[]>([])

    /*
     * =====================================================
     * REGLA ÚNICA DE TODO EL EDITOR
     * =====================================================
     *
     * pendingFrom === null  -> el próximo punto que se toque
     *                          se convierte en el punto A.
     *
     * pendingFrom !== null  -> el próximo punto que se toque
     *                          es el punto B: se crea el tramo
     *                          A -> B, y B pasa a ser el nuevo A
     *                          para poder encadenar el siguiente
     *                          tramo.
     *
     * Esto sigue aplicando siempre, sin excepciones: ni al
     * abrir un tramo, ni al seleccionarlo desde el panel.
     */

    const [pendingFrom, setPendingFrom] =
        useState<RoutePoint | null>(null)

    /*
     * =====================================================
     * EXCEPCIÓN ÚNICA: JUSTO DESPUÉS DE BORRAR
     * =====================================================
     *
     * Al borrar un tramo, el punto A del siguiente tramo NO
     * puede decidirlo el código (no sabemos con cuál de los
     * puntos existentes quería reconectar el usuario). Por
     * eso, mientras esto sea true:
     *
     * - un click libre en el mapa NO cuenta como punto A
     * - solo un click sobre un punto ya existente (marcador)
     *   puede fijar el nuevo punto A
     *
     * En cuanto el usuario elige ese punto, esto vuelve a
     * false y se retoma la regla única de siempre.
     */

    const [
        requireExistingPointAfterDelete,
        setRequireExistingPointAfterDelete,
    ] = useState(false)

    const [selectedSegmentId, setSelectedSegmentId] =
        useState<string | null>(null)

    const [form, setForm] =
        useState<RouteFormState>(
            initialForm
        )

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

    const allFeatureIds =
        Array.from(
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
        setForm(
            (previous) => ({
                ...previous,
                [field]: value,
            })
        )
    }

    /*
     * =====================================================
     * BORRAR TRAMO
     * =====================================================
     *
     * Al borrar, siempre volvemos al estado base: no hay A.
     *
     * Si todavía quedan tramos, además exigimos que el
     * siguiente punto A se elija explícitamente sobre un
     * punto ya existente (no vale un click libre en el
     * mapa): es el usuario quien decide con qué punto
     * quiere continuar la ruta, nunca el código.
     */

    const handleDeleteSegment =
        useCallback(
            (segmentId: string) => {
                setSegments(
                    (previous) => {
                        const remaining =
                            previous.filter(
                                (segment) =>
                                    segment.id !==
                                    segmentId
                            )

                        setRequireExistingPointAfterDelete(
                            remaining.length > 0
                        )

                        return remaining
                    }
                )

                setPendingFrom(null)
                setSelectedSegmentId(null)
                setSaveError(null)
                setSavedRouteName(null)
            },
            []
        )

    /*
     * =====================================================
     * CREAR TRAMO A -> B
     * =====================================================
     */

    const calculateSegment =
        useCallback(
            async (
                from: RoutePoint,
                to: RoutePoint
            ) => {
                /*
                 * Evitamos crear un tramo de un punto
                 * exactamente al mismo punto.
                 */

                if (
                    pointsAreEqual(
                        from,
                        to
                    )
                ) {
                    return
                }

                const segmentId =
                    createSegmentId()

                const newSegment:
                    RouteSegment = {
                    id: segmentId,

                    name: '',

                    from,

                    to,

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

                setSelectedSegmentId(
                    segmentId
                )

                /*
                 * =============================================
                 * ITINERO
                 * =============================================
                 */

                try {
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

                    /*
                     * =========================================
                     * FEATURES CERCA DEL TRACK
                     * =========================================
                     */

                    try {
                        const features =
                            await getFeaturesAlongTrack(
                                routing.shape
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
                    } catch (
                    error
                    ) {
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
                } catch (
                error
                ) {
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

                                            nearbyLoading:
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
            },
            []
        )

    /*
     * =====================================================
     * ÚNICO PUNTO DE ENTRADA PARA FIJAR A O B
     * =====================================================
     *
     * Lo usan por igual el click libre en el mapa y el click
     * sobre cualquier marcador (A o B) de cualquier tramo ya
     * existente. No hay ninguna otra vía para fijar un punto,
     * así que la regla "sin A no hay B" solo tiene que vivir
     * aquí, una vez.
     *
     * `isExistingPoint` indica si el click viene de un marcador
     * real (true) o de un punto libre del mapa (false). Solo
     * importa justo después de borrar un tramo: en ese momento
     * un click libre no puede decidir por el usuario cuál es
     * el punto A de reconexión.
     */

    const handlePointSelected =
        useCallback(
            (
                point: RoutePoint,
                isExistingPoint: boolean
            ) => {
                if (saving) {
                    return
                }

                /*
                 * Justo después de borrar: un click libre no
                 * cuenta. El usuario tiene que elegir uno de
                 * los puntos ya existentes.
                 */

                if (
                    requireExistingPointAfterDelete &&
                    !isExistingPoint
                ) {
                    return
                }

                setSaveError(null)
                setSavedRouteName(null)

                if (
                    requireExistingPointAfterDelete
                ) {
                    setRequireExistingPointAfterDelete(
                        false
                    )
                }

                /*
                 * No hay A todavía: este punto se convierte
                 * en el punto A.
                 */

                if (!pendingFrom) {
                    setPendingFrom(
                        point
                    )

                    return
                }

                /*
                 * Ya hay A: este punto es el B. Creamos el
                 * tramo A -> B.
                 */

                const from =
                    pendingFrom

                const to =
                    point

                calculateSegment(
                    from,
                    to
                )

                /*
                 * B se convierte automáticamente en el A
                 * del siguiente tramo, para poder encadenar:
                 *
                 * A -> B
                 * B -> C
                 * C -> D
                 */

                setPendingFrom(
                    to
                )
            },
            [
                pendingFrom,
                calculateSegment,
                saving,
                requireExistingPointAfterDelete,
            ]
        )

    /*
     * =====================================================
     * CLICK LIBRE EN MAPA
     * =====================================================
     */

    const handleMapClick =
        useCallback(
            (point: RoutePoint) => {
                handlePointSelected(
                    point,
                    false
                )
            },
            [
                handlePointSelected,
            ]
        )

    /*
     * =====================================================
     * CLICK SOBRE UN MARCADOR (A o B) DE UN TRAMO EXISTENTE
     * =====================================================
     *
     * Sigue exactamente la misma regla que el mapa vacío:
     * si no hay A, este punto es A; si ya hay A, se crea el
     * tramo A -> este punto. Esto permite conectar dos puntos
     * ya existentes directamente, sin pasar por un click libre
     * intermedio. Además, es el único tipo de click válido
     * justo después de borrar un tramo.
     */

    const handleMarkerClick =
        useCallback(
            (point: RoutePoint) => {
                handlePointSelected(
                    point,
                    true
                )
            },
            [
                handlePointSelected,
            ]
        )

    /*
     * =====================================================
     * ABRIR TRAMO (clic en la línea dibujada)
     * =====================================================
     *
     * Solo sirve para ver/editar el tramo en el panel.
     * No toca pendingFrom bajo ningún concepto: mirar un
     * tramo no debe interrumpir un punto A que ya tengas
     * pendiente.
     */

    const handleOpenSegment =
        useCallback(
            (segmentId: string) => {
                setSaveError(null)
                setSavedRouteName(null)
                setSelectedSegmentId(
                    segmentId
                )
            },
            []
        )

    /*
     * =====================================================
     * SELECCIONAR TRAMO DESDE EL PANEL LATERAL
     * =====================================================
     *
     * Igual que handleOpenSegment: solo abre/cierra las
     * opciones de edición del tramo, nunca toca pendingFrom.
     */

    const handleSelectSegment =
        useCallback(
            (segmentId: string) => {
                setSelectedSegmentId(
                    (current) =>
                        current ===
                            segmentId
                            ? null
                            : segmentId
                )
            },
            []
        )

    /*
     * =====================================================
     * ACTUALIZAR TRAMO
     * =====================================================
     */

    const updateSegment =
        useCallback(
            (
                segmentId: string,
                changes: Partial<RouteSegment>
            ) => {
                setSegments(
                    (previous) =>
                        previous.map(
                            (segment) =>
                                segment.id ===
                                    segmentId
                                    ? {
                                        ...segment,
                                        ...changes,
                                    }
                                    : segment
                        )
                )
            },
            []
        )

    /*
     * =====================================================
     * BORRAR TODO
     * =====================================================
     */

    const handleClearAll =
        useCallback(
            () => {
                if (
                    segments.length === 0
                ) {
                    return
                }

                const confirmed =
                    window.confirm(
                        '¿Seguro que quieres borrar todos los tramos? Esta acción no se puede deshacer.'
                    )

                if (!confirmed) {
                    return
                }

                setSegments([])
                setPendingFrom(null)
                setSelectedSegmentId(
                    null
                )
                setRequireExistingPointAfterDelete(
                    false
                )
                setSavedRouteName(null)
                setSaveError(null)
            },
            [
                segments.length,
            ]
        )

    /*
     * =====================================================
     * SALIR
     * =====================================================
     */

    const handleExitEditor =
        useCallback(
            () => {
                window.history.back()
            },
            []
        )

    /*
     * =====================================================
     * GUARDAR RUTA
     * =====================================================
     */

    const submitRoute =
        () => {
            if (
                segments.length ===
                0
            ) {
                setSaveError(
                    'Selecciona al menos dos puntos para crear una ruta.'
                )

                return
            }

            /*
             * Nunca guardamos mientras haya cálculos
             * pendientes.
             */

            const loading =
                segments.some(
                    (segment) =>
                        segment.routingLoading
                )

            if (loading) {
                setSaveError(
                    'Espera a que termine de calcularse la ruta.'
                )

                return
            }

            /*
             * Si hay un punto pendiente significa que
             * el usuario ha empezado un tramo pero todavía
             * no ha seleccionado el punto B.
             */

            if (
                pendingFrom
            ) {
                setSaveError(
                    'Has seleccionado un punto inicial pero falta el punto final.'
                )

                return
            }

            /*
             * Todavía hace falta que el usuario elija con
             * qué punto existente reconectar tras un borrado.
             */

            if (
                requireExistingPointAfterDelete
            ) {
                setSaveError(
                    'Selecciona un punto existente para continuar la ruta antes de guardar.'
                )

                return
            }

            /*
             * =============================================
             * NOMBRES
             * =============================================
             */

            const segmentWithoutName =
                segments.find(
                    (segment) =>
                        !segment.name.trim()
                )

            if (
                segmentWithoutName
            ) {
                setSaveError(
                    'Todos los tramos deben tener un nombre.'
                )

                setSelectedSegmentId(
                    segmentWithoutName.id
                )

                return
            }

            /*
             * =============================================
             * VALIDAR CONTINUIDAD
             * =============================================
             */

            const continuityError =
                validateRouteContinuity(
                    segments
                )

            if (
                continuityError
            ) {
                setSaveError(
                    continuityError
                )

                return
            }

            /*
             * =============================================
             * CREAR TRACK CONTINUO
             * =============================================
             */

            const track =
                buildContinuousTrack(
                    segments
                )

            if (
                track.length < 2
            ) {
                setSaveError(
                    'No se ha podido obtener el recorrido calculado.'
                )

                return
            }

            /*
             * =============================================
             * PAYLOAD
             * =============================================
             */

            const payload:
                CreateMountainRoute = {
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

            createRoute(
                payload
            )
                .then(
                    (created) => {
                        setSavedRouteName(
                            created.name
                        )

                        setForm(
                            initialForm
                        )

                        setSegments(
                            []
                        )

                        setPendingFrom(
                            null
                        )

                        setSelectedSegmentId(
                            null
                        )
                    }
                )
                .catch(
                    (error) => {
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
                    }
                )
                .finally(
                    () =>
                        setSaving(
                            false
                        )
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

                <MapView>

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler
                        disabled={
                            saving ||
                            requireExistingPointAfterDelete
                        }
                        onMapClick={
                            handleMapClick
                        }
                    />

                    {/* =========================================
                        RUTAS CALCULADAS
                    ========================================= */}

                    {segments.map(
                        (segment) =>
                            segment
                                .routingShape
                                .length >
                            1 && (
                                <Polyline
                                    key={
                                        segment.id
                                    }

                                    positions={
                                        segment.routingShape.map(
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
                                    }

                                    pathOptions={{
                                        color:
                                            segment.id ===
                                                selectedSegmentId
                                                ? '#2563eb'
                                                : '#ef4444',

                                        weight:
                                            segment.id ===
                                                selectedSegmentId
                                                ? 8
                                                : 5,

                                        opacity:
                                            0.85,
                                    }}

                                    /*
                                     * MUY IMPORTANTE:
                                     *
                                     * El click de la Polyline no
                                     * se propaga al mapa.
                                     */

                                    bubblingMouseEvents={
                                        false
                                    }

                                    eventHandlers={{
                                        click: () => {
                                            handleOpenSegment(
                                                segment.id
                                            )
                                        },
                                    }}
                                />
                            )
                    )}

                    {/* =========================================
                        PUNTO A PENDIENTE
                    ========================================= */}

                    {pendingFrom && (
                        <CircleMarker
                            center={[
                                pendingFrom.latitude,
                                pendingFrom.longitude,
                            ]}

                            radius={
                                9
                            }

                            pathOptions={{
                                color: '#15803d',
                                fillColor: '#22c55e',
                                fillOpacity: 1,
                                weight: 3,
                            }}

                            bubblingMouseEvents={
                                false
                            }

                            eventHandlers={{
                                click: (
                                    event
                                ) => {
                                    /*
                                     * Este marcador ES el punto A
                                     * pendiente. No hace falta
                                     * volver a clicarlo para nada,
                                     * simplemente evitamos que el
                                     * click se propague al mapa.
                                     */
                                    event.originalEvent.stopPropagation()
                                },
                            }}
                        />
                    )}

                    {/* =========================================
                        PUNTOS A/B DE CADA TRAMO
                    ========================================= */}

                    {segments.map(
                        (
                            segment
                        ) => (
                            <Fragment
                                key={
                                    `points-${segment.id}`
                                }
                            >

                                {/* =============================
                                    PUNTO A
                                ============================= */}

                                <CircleMarker
                                    center={[
                                        segment.from.latitude,
                                        segment.from.longitude,
                                    ]}

                                    radius={
                                        7
                                    }

                                    pathOptions={{
                                        color: '#16a34a',
                                        fillColor: '#22c55e',
                                        fillOpacity: 1,
                                        weight: 3,
                                    }}

                                    bubblingMouseEvents={
                                        false
                                    }

                                    eventHandlers={{
                                        click: (
                                            event
                                        ) => {
                                            event.originalEvent.stopPropagation()

                                            handleMarkerClick(
                                                segment.from
                                            )
                                        },
                                    }}
                                />

                                {/* =============================
                                    PUNTO B
                                ============================= */}

                                <CircleMarker
                                    center={[
                                        segment.to.latitude,
                                        segment.to.longitude,
                                    ]}

                                    radius={
                                        7
                                    }

                                    pathOptions={{
                                        color: '#dc2626',
                                        fillColor: '#ef4444',
                                        fillOpacity: 1,
                                        weight: 3,
                                    }}

                                    bubblingMouseEvents={
                                        false
                                    }

                                    eventHandlers={{
                                        click: (
                                            event
                                        ) => {
                                            event.originalEvent.stopPropagation()

                                            handleMarkerClick(
                                                segment.to
                                            )
                                        },
                                    }}
                                />

                            </Fragment>
                        )
                    )}

                </MapView>

                {/* =================================================
                    MENSAJE DE ESTADO DEL MAPA
                ================================================= */}

                <div className="fixed left-4 top-20 z-[1000] rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-gray-800 shadow-lg">

                    {requireExistingPointAfterDelete
                        ? '🔗 Selecciona un punto existente para continuar la ruta'
                        : !pendingFrom
                            ? '📍 Haz clic para colocar el punto A'
                            : '📍 Ahora coloca el punto B'}

                </div>

                {/* =================================================
                    AVISO DE RECONEXIÓN TRAS BORRAR
                ================================================= */}

                {requireExistingPointAfterDelete && (
                    <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-xl bg-purple-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
                        🔗 Clica sobre un punto existente para continuar
                    </div>
                )}

                {/* =================================================
                    CALCULANDO
                ================================================= */}

                {segments.some(
                    (segment) =>
                        segment.routingLoading
                ) && (
                        <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                            🧭 Calculando ruta...
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
                    AVISO DE RECONEXIÓN TRAS BORRAR
                ================================================= */}

                {requireExistingPointAfterDelete && (
                    <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-3">

                        <div className="text-sm font-bold text-purple-800">
                            Continuar ruta
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-purple-700">
                            Has eliminado un tramo.
                            Selecciona en el mapa uno de los
                            puntos existentes para indicar desde
                            dónde quieres continuar.
                        </p>

                    </div>
                )}

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

                {segments.length > 0 && (
                    <div className="mt-5">

                        <div className="flex items-center justify-between">

                            <h3 className="text-sm font-bold text-gray-800">
                                Tramos
                            </h3>

                            <button
                                type="button"
                                onClick={
                                    handleClearAll
                                }
                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                                Borrar todo
                            </button>

                        </div>

                        <div className="mt-2 space-y-2">

                            {segments.map(
                                (
                                    segment
                                ) => {

                                    const selected =
                                        segment.id ===
                                        selectedSegmentId

                                    return (
                                        <div
                                            key={
                                                segment.id
                                            }
                                        >

                                            {/* =================================================
                                                CABECERA
                                            ================================================= */}

                                            <div
                                                onClick={() =>
                                                    handleSelectSegment(
                                                        segment.id
                                                    )
                                                }
                                                className={`w-full cursor-pointer rounded-lg border p-3 text-left transition ${selected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                                    }`}
                                            >

                                                <div className="flex items-center justify-between gap-2">

                                                    <div className="min-w-0 flex-1">

                                                        <span className="font-semibold text-gray-800">
                                                            {segment.name ||
                                                                'Sin nombre'}
                                                        </span>

                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-2">

                                                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                                            {
                                                                segment.difficulty
                                                            }
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation()

                                                                handleDeleteSegment(
                                                                    segment.id
                                                                )
                                                            }}
                                                            className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                                                            title="Eliminar tramo"
                                                            aria-label="Eliminar tramo"
                                                        >
                                                            ×
                                                        </button>

                                                    </div>

                                                </div>

                                                {/* =================================================
                                                    INFORMACIÓN
                                                ================================================= */}

                                                <div className="mt-2 text-xs text-gray-500">

                                                    {segment.routingLoading
                                                        ? '🧭 Calculando camino...'
                                                        : segment.distanceMeters !== null
                                                            ? `${(
                                                                segment.distanceMeters /
                                                                1000
                                                            ).toFixed(2)} km`
                                                            : 'Sin distancia'}

                                                    {' · '}

                                                    {segment.nearbyLoading
                                                        ? 'Buscando elementos...'
                                                        : `${segment.featureIds.length} elementos`}

                                                </div>

                                                {segment.error && (
                                                    <div className="mt-2 text-xs text-red-600">
                                                        {
                                                            segment.error
                                                        }
                                                    </div>
                                                )}

                                            </div>

                                            {/* =================================================
                                                OPCIONES DEL TRAMO
                                            ================================================= */}

                                            {selected && (
                                                <div className="rounded-b-xl border border-t-0 border-blue-200 bg-blue-50 p-3">

                                                    {/* NOMBRE */}

                                                    <label className="flex flex-col gap-1 text-sm text-gray-700">

                                                        Nombre del tramo

                                                        <input
                                                            type="text"
                                                            required
                                                            value={
                                                                segment.name
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateSegment(
                                                                    segment.id,
                                                                    {
                                                                        name:
                                                                            e.target.value,
                                                                    }
                                                                )
                                                            }
                                                            placeholder="Ej. Subida al Montcau"
                                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                                                        />

                                                    </label>

                                                    {/* DIFICULTAD */}

                                                    <label className="mt-3 flex flex-col gap-1 text-sm text-gray-700">

                                                        Dificultad

                                                        <select
                                                            value={
                                                                segment.difficulty
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateSegment(
                                                                    segment.id,
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
                                                                segment.criticalSection
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateSegment(
                                                                    segment.id,
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
                                                                segment.personalRecommendations
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateSegment(
                                                                    segment.id,
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
                                                                    segment.featureIds.length
                                                                }
                                                            </strong>

                                                        </div>

                                                        {segment.features.length > 0 && (
                                                            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">

                                                                {segment.features.map(
                                                                    (
                                                                        feature
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                feature.id
                                                                            }
                                                                            className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-1.5 text-xs text-gray-700"
                                                                        >

                                                                            <span className="min-w-0 truncate font-medium">
                                                                                {feature.name ||
                                                                                    'Sin nombre'}
                                                                            </span>

                                                                            <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
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

                                                </div>
                                            )}

                                        </div>
                                    )
                                }
                            )}

                        </div>

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

                    {/* =================================================
                        IDS DE ELEMENTOS
                    ================================================= */}

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

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {saveError && (
                        <p className="text-sm text-red-600">
                            {
                                saveError
                            }
                        </p>
                    )}

                    {/* =================================================
                        GUARDADO CORRECTO
                    ================================================= */}

                    {savedRouteName && (
                        <p className="text-sm text-emerald-700">
                            Ruta "
                            {
                                savedRouteName
                            }
                            " guardada correctamente.
                        </p>
                    )}

                    {/* =================================================
                        GUARDAR
                    ================================================= */}

                    <button
                        type="submit"
                        disabled={
                            saving ||
                            segments.length ===
                            0 ||
                            requireExistingPointAfterDelete ||
                            Boolean(
                                pendingFrom
                            ) ||
                            segments.some(
                                (
                                    segment
                                ) =>
                                    segment.routingLoading
                            )
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