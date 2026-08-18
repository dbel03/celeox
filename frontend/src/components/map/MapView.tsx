import { springIcon } from './icons'
import MarkerClusterGroup from 'react-leaflet-cluster'

import {
    useCallback,
    useEffect,
    useState,
} from 'react'

import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMapEvents,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import {
    getMap,
    getSprings,
} from '../../services/api'

import type { MountainFeature } from '../../services/api'


interface MapData {
    latitude: number
    longitude: number
    zoom: number
}


interface MapBounds {
    minLat: number
    maxLat: number
    minLon: number
    maxLon: number
}

function MapEvents({
    onBoundsChange,
}: {
    onBoundsChange: (
        bounds: MapBounds,
        zoom: number
    ) => void
}) {
    const map = useMapEvents({
        moveend: () => {
            const bounds = map.getBounds()

            onBoundsChange(
                {
                    minLat: bounds.getSouth(),
                    maxLat: bounds.getNorth(),
                    minLon: bounds.getWest(),
                    maxLon: bounds.getEast(),
                },
                map.getZoom()
            )
        },
    })

    useEffect(() => {
        const bounds = map.getBounds()

        onBoundsChange(
            {
                minLat: bounds.getSouth(),
                maxLat: bounds.getNorth(),
                minLon: bounds.getWest(),
                maxLon: bounds.getEast(),
            },
            map.getZoom()
        )
    }, [map, onBoundsChange])

    return null
}

function MapView() {

    const [mapData, setMapData] =
        useState<MapData | null>(null)

    const [springs, setSprings] =
        useState<MountainFeature[]>([])

    const [error, setError] =
        useState<string | null>(null)

    const [zoom, setZoom] =
        useState<number>(0)


    const loadSprings = useCallback(
        (bounds: MapBounds, zoom: number) => {

            setZoom(zoom)

            // Si estamos demasiado alejados,
            // no mostramos fuentes.
            if (zoom < 12) {
                setSprings([])
                return
            }

            getSprings(
                bounds.minLat,
                bounds.maxLat,
                bounds.minLon,
                bounds.maxLon
            )
                .then((data) => {
                    console.log(
                        'Fuentes de la zona:',
                        data.length
                    )

                    setSprings(data)
                })
                .catch((error) => {
                    console.error(
                        'Error cargando fuentes:',
                        error
                    )
                })
        },
        []
    )

    const catalunyaBounds: [
        [number, number],
        [number, number]
    ] = [
            [40.5, 0.15],   // Sur-Oeste
            [42.9, 3.35],   // Norte-Este
        ]

    useEffect(() => {

        getMap()
            .then((data) => {
                setMapData(data)
            })
            .catch((error) => {

                console.error(error)

                setError(
                    'No se ha podido conectar con el servidor'
                )
            })

    }, [])

    if (error) {

        return (
            <div className="flex h-full w-full items-center justify-center">

                <p className="text-red-500">
                    {error}
                </p>

            </div>
        )
    }


    if (!mapData) {

        return (
            <div className="flex h-full w-full items-center justify-center">

                <p>
                    Cargando mapa...
                </p>

            </div>
        )
    }

    const center: [number, number] = [
        mapData.latitude,
        mapData.longitude,
    ]

    return (

        <div className="relative h-full w-full">

            <MapContainer
                center={center}
                zoom={mapData.zoom}
                minZoom={8}
                scrollWheelZoom={true}
                maxBounds={catalunyaBounds}
                maxBoundsViscosity={1.0}
                className="h-full w-full"
            >

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                {/* Detecta la zona visible del mapa */}
                <MapEvents
                    onBoundsChange={loadSprings}
                />


                {/* Marcador de la posición inicial */}
                <Marker position={center}>

                    <Popup>

                        <strong>
                            Ubicación recibida desde C#
                        </strong>

                        <br />

                        Latitud: {mapData.latitude}

                        <br />

                        Longitud: {mapData.longitude}

                    </Popup>

                </Marker>


                {/* Fuentes */}

                <MarkerClusterGroup>

                    {springs.map((spring) => (

                        <Marker
                            key={spring.id}
                            position={[
                                spring.latitude,
                                spring.longitude,
                            ]}
                            icon={springIcon}
                        >

                            <Popup>

                                <div className="min-w-[220px]">

                                    {/* Nombre */}

                                    <h3 className="mb-2 text-lg font-bold">

                                        💧{' '}

                                        {spring.name ??
                                            'Fuente sin nombre'}

                                    </h3>


                                    {/* Información básica */}

                                    <div className="space-y-1 text-sm">

                                        <p>
                                            <strong>
                                                Tipo:
                                            </strong>{' '}
                                            Manantial
                                        </p>


                                        <p>
                                            <strong>
                                                Latitud:
                                            </strong>{' '}

                                            {spring.latitude}
                                        </p>


                                        <p>
                                            <strong>
                                                Longitud:
                                            </strong>{' '}

                                            {spring.longitude}
                                        </p>

                                    </div>


                                    {/* Tags de OpenStreetMap */}

                                    {spring.tags && (

                                        <div className="mt-3 border-t pt-2">

                                            <p className="mb-1 font-semibold">

                                                Información OSM

                                            </p>


                                            <div className="space-y-1 text-xs">

                                                {Object.entries(
                                                    spring.tags
                                                ).map(
                                                    ([key, value]) => (

                                                        <div
                                                            key={key}
                                                        >

                                                            <strong>
                                                                {key}:
                                                            </strong>{' '}

                                                            {value}

                                                        </div>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                    )}

                                </div>

                            </Popup>

                        </Marker>

                    ))}

                </MarkerClusterGroup>

            </MapContainer>

            {/* Contador + zoom */}
            <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-white p-4 shadow-lg">

                <div>
                    <strong>
                        Fuentes: {springs.length}
                    </strong>
                </div>

                <div>
                    Zoom: {zoom}
                </div>

            </div>

        </div>
    )
}


export default MapView