import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    CircleMarker,
    Polyline,
    useMap,
    useMapEvents,
} from 'react-leaflet'


/* =========================================================
   TIPOS
========================================================= */

export interface RoutePoint {
    latitude: number
    longitude: number
}


interface RouteDrawingProps {
    active: boolean
    points: RoutePoint[]
    onChange: (points: RoutePoint[]) => void
}


/* =========================================================
   DISTANCIA MÍNIMA ENTRE PUNTOS
========================================================= */

/*
 * Evita guardar cientos/miles de puntos cuando el ratón
 * se mueve muy poco.
 *
 * Está expresado aproximadamente en metros.
 */

const MIN_POINT_DISTANCE_METERS = 3


function distanceInMeters(
    a: RoutePoint,
    b: RoutePoint
): number {

    const earthRadius = 6371000

    const lat1 = a.latitude * Math.PI / 180
    const lat2 = b.latitude * Math.PI / 180

    const deltaLat =
        (b.latitude - a.latitude) *
        Math.PI / 180

    const deltaLon =
        (b.longitude - a.longitude) *
        Math.PI / 180

    const sinLat =
        Math.sin(deltaLat / 2)

    const sinLon =
        Math.sin(deltaLon / 2)

    const value =
        sinLat * sinLat +
        Math.cos(lat1) *
        Math.cos(lat2) *
        sinLon * sinLon

    const angularDistance =
        2 *
        Math.atan2(
            Math.sqrt(value),
            Math.sqrt(1 - value)
        )

    return earthRadius * angularDistance
}


/* =========================================================
   CONTROLADOR DEL RATÓN
========================================================= */

function DrawingController({
    active,
    onStartDrawing,
    onAddPoint,
    onEndDrawing,
}: {
    active: boolean
    onStartDrawing: (point: RoutePoint) => void
    onAddPoint: (point: RoutePoint) => void
    onEndDrawing: () => void
}) {

    const map = useMap()

    const drawingRef =
        useRef(false)


    /* =====================================================
       CURSOR
    ===================================================== */

    useEffect(() => {

        if (!active) {

            map.getContainer().style.cursor = ''

            return

        }

        map.getContainer().style.cursor = 'crosshair'


        return () => {

            map.getContainer().style.cursor = ''

        }

    }, [
        active,
        map,
    ])


    /* =====================================================
       EVENTOS DEL MAPA
    ===================================================== */

    useMapEvents({

        mousedown(event) {

            if (!active) {
                return
            }

            /*
             * Solo botón izquierdo.
             */

            if (event.originalEvent.button !== 0) {
                return
            }

            drawingRef.current = true

            const point: RoutePoint = {
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            }

            onStartDrawing(point)

            /*
             * Evita que el mapa intente hacer drag mientras
             * estamos dibujando.
             */

            map.dragging.disable()
        },


        mousemove(event) {

            if (!active) {
                return
            }

            if (!drawingRef.current) {
                return
            }

            onAddPoint({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            })
        },


        mouseup() {

            if (!drawingRef.current) {
                return
            }

            drawingRef.current = false

            map.dragging.enable()

            onEndDrawing()
        },


        mouseout() {

            /*
             * No terminamos automáticamente el dibujo aquí.
             * Leaflet puede generar mouseout al interactuar
             * con elementos internos del mapa.
             */
        },

    })


    return null
}


/* =========================================================
   TRACKER DEL RATÓN
========================================================= */

function MouseTracker({
    active,
    onMove,
}: {
    active: boolean
    onMove: (point: RoutePoint) => void
}) {

    useMapEvents({

        mousemove(event) {

            if (!active) {
                return
            }

            onMove({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            })
        },

    })


    return null
}


/* =========================================================
   ROUTE DRAWING
========================================================= */

function RouteDrawing({
    active,
    points,
    onChange,
}: RouteDrawingProps) {

    const [
        mousePosition,
        setMousePosition,
    ] = useState<RoutePoint | null>(null)


    const [
        isDrawing,
        setIsDrawing,
    ] = useState(false)


    /*
     * Guardamos el último punto añadido para controlar
     * la distancia mínima.
     */

    const lastPointRef =
        useRef<RoutePoint | null>(null)


    /* =====================================================
       INICIAR TRAZO
    ===================================================== */

    const handleStartDrawing =
        useCallback(
            (point: RoutePoint) => {

                setIsDrawing(true)

                lastPointRef.current = point

                /*
                 * Añadimos el primer punto del trazo.
                 */

                onChange([
                    ...points,
                    point,
                ])

            },
            [
                points,
                onChange,
            ]
        )


    /* =====================================================
       AÑADIR PUNTO DURANTE EL TRAZO
    ===================================================== */

    const handleAddPoint =
        useCallback(
            (point: RoutePoint) => {

                if (!isDrawing) {
                    return
                }


                const lastPoint =
                    lastPointRef.current


                /*
                 * Si el punto está demasiado cerca del anterior,
                 * no lo guardamos.
                 */

                if (
                    lastPoint &&
                    distanceInMeters(
                        lastPoint,
                        point
                    ) < MIN_POINT_DISTANCE_METERS
                ) {

                    return

                }


                lastPointRef.current = point


                onChange([
                    ...points,
                    point,
                ])

            },
            [
                isDrawing,
                points,
                onChange,
            ]
        )


    /* =====================================================
       TERMINAR TRAZO
    ===================================================== */

    const handleEndDrawing =
        useCallback(
            () => {

                setIsDrawing(false)

                lastPointRef.current = null

            },
            []
        )


    /* =====================================================
       RATÓN
    ===================================================== */

    const handleMouseMove =
        useCallback(
            (point: RoutePoint) => {

                setMousePosition(point)

            },
            []
        )


    /* =====================================================
       NO ACTIVO
    ===================================================== */

    if (!active) {

        return null

    }


    /* =====================================================
       POSICIONES
    ===================================================== */

    const positions: [number, number][] =
        points.map(
            (point) => [
                point.latitude,
                point.longitude,
            ]
        )


    /* =====================================================
       PREVISUALIZACIÓN
    ===================================================== */

    const previewPositions: [number, number][] =
        isDrawing &&
        mousePosition &&
        points.length > 0
            ? [
                ...positions,
                [
                    mousePosition.latitude,
                    mousePosition.longitude,
                ],
            ]
            : positions


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <>

            {/* =================================================
                CONTROLADOR DEL DIBUJO
            ================================================= */}

            <DrawingController
                active={active}
                onStartDrawing={handleStartDrawing}
                onAddPoint={handleAddPoint}
                onEndDrawing={handleEndDrawing}
            />


            {/* =================================================
                TRACKER DEL RATÓN
            ================================================= */}

            <MouseTracker
                active={active}
                onMove={handleMouseMove}
            />


            {/* =================================================
                RUTA
            ================================================= */}

            {positions.length >= 2 && (

                <Polyline
                    positions={positions}
                    pathOptions={{
                        color: '#059669',
                        weight: 5,
                        opacity: 0.9,
                        lineCap: 'round',
                        lineJoin: 'round',
                    }}
                />

            )}


            {/* =================================================
                PREVISUALIZACIÓN
            ================================================= */}

            {previewPositions.length >= 2 &&
                isDrawing &&
                mousePosition && (

                    <Polyline
                        positions={previewPositions}
                        pathOptions={{
                            color: '#059669',
                            weight: 3,
                            opacity: 0.45,
                            dashArray: '8 8',
                            lineCap: 'round',
                            lineJoin: 'round',
                        }}
                    />

                )}


            {/* =================================================
                PUNTOS
            ================================================= */}

            {positions.map(
                (position, index) => (

                    <CircleMarker
                        key={`${position[0]}-${position[1]}-${index}`}
                        center={position}
                        radius={3}
                        pathOptions={{
                            color: '#ffffff',
                            weight: 1,
                            fillColor: '#059669',
                            fillOpacity: 1,
                        }}
                    />

                )
            )}

        </>

    )
}


export default RouteDrawing