import {
    useCallback,
    useEffect,
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
   CONTROLADOR DE DIBUJO
========================================================= */

function DrawingController({
    active,
    onAddPoint,
}: {
    active: boolean
    onAddPoint: (point: RoutePoint) => void
}) {

    const map = useMap()


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


    useMapEvents({

        click(event) {

            if (!active) {
                return
            }


            onAddPoint({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            })

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
    onLeave,
}: {
    active: boolean
    onMove: (point: RoutePoint) => void
    onLeave: () => void
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

        mouseout() {

            onLeave()

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


    /* =====================================================
       AÑADIR PUNTO
    ===================================================== */

    const handleAddPoint =
        useCallback(
            (point: RoutePoint) => {

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
       MOVER RATÓN
    ===================================================== */

    const handleMouseMove =
        useCallback(
            (point: RoutePoint) => {

                setMousePosition(point)

            },
            []
        )


    /* =====================================================
       SALIR DEL MAPA
    ===================================================== */

    const handleMouseLeave =
        useCallback(
            () => {

                setMousePosition(null)

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
       POSICIONES DE LA RUTA
    ===================================================== */

    const positions: [number, number][] =
        points.map(
            (point) => [
                point.latitude,
                point.longitude,
            ]
        )


    /* =====================================================
       POSICIONES DE PREVISUALIZACIÓN
    ===================================================== */

    const previewPositions: [number, number][] =
        mousePosition && points.length > 0
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
                CONTROLADOR DE DIBUJO
            ================================================= */}

            <DrawingController
                active={active}
                onAddPoint={handleAddPoint}
            />


            {/* =================================================
                TRACKER DEL RATÓN
            ================================================= */}

            <MouseTracker
                active={active}
                onMove={handleMouseMove}
                onLeave={handleMouseLeave}
            />


            {/* =================================================
                RUTA REAL
            ================================================= */}

            {positions.length >= 2 && (

                <Polyline
                    positions={positions}
                    pathOptions={{
                        color: '#059669',
                        weight: 5,
                        opacity: 0.9,
                    }}
                />

            )}


            {/* =================================================
                PREVISUALIZACIÓN
            ================================================= */}

            {previewPositions.length >= 2 &&
                mousePosition && (

                    <Polyline
                        positions={previewPositions}
                        pathOptions={{
                            color: '#059669',
                            weight: 3,
                            opacity: 0.45,
                            dashArray: '8 8',
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
                        radius={6}
                        pathOptions={{
                            color: '#ffffff',
                            weight: 2,
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