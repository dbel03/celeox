import { springIcon,userLocationIcon } from './icons'
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
    getSprings,
} from '../../services/api'

import type { MountainFeature } from '../../services/api'


interface MapBounds {
    minLat: number
    maxLat: number
    minLon: number
    maxLon: number
}


/*
 * Detecta cuando cambia la zona visible del mapa
 */
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


    /*
     * Cargar fuentes inicialmente
     */
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

    /*
     * Ubicación actual del usuario
     *
     * Se actualiza mediante watchPosition()
     */
    const [userLocation, setUserLocation] =
        useState<[number, number] | null>(null)


    /*
     * Fuentes visibles
     */
    const [springs, setSprings] =
        useState<MountainFeature[]>([])


    /*
     * Error de geolocalización
     */
    const [error, setError] =
        useState<string | null>(null)


    /*
     * Zoom actual
     */
    const [zoom, setZoom] =
        useState<number>(13)


    /*
     * Cargar fuentes según la zona visible
     */
    const loadSprings = useCallback(
        (
            bounds: MapBounds,
            zoom: number
        ) => {

            setZoom(zoom)


            /*
             * Si estamos demasiado alejados,
             * no mostramos fuentes.
             */
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


    /*
     * Límites del mapa: Catalunya
     */
    const catalunyaBounds: [
        [number, number],
        [number, number]
    ] = [
        [40.5, 0.15],
        [42.9, 3.35],
    ]


    /*
     * Obtener ubicación del usuario
     * y actualizarla en tiempo real.
     */
    useEffect(() => {

        /*
         * Comprobar si el navegador soporta
         * geolocalización.
         */
        if (!navigator.geolocation) {

            setError(
                'La geolocalización no está disponible en este navegador'
            )

            return
        }


        /*
         * watchPosition mantiene el seguimiento
         * de la ubicación.
         */
        const watchId =
            navigator.geolocation.watchPosition(

                (position) => {

                    const {
                        latitude,
                        longitude,
                    } = position.coords


                    console.log(
                        'Nueva ubicación:',
                        latitude,
                        longitude
                    )


                    setUserLocation([
                        latitude,
                        longitude,
                    ])
                },


                (error) => {

                    console.error(
                        'Error obteniendo ubicación:',
                        error
                    )

                    setError(
                        'No se ha podido obtener tu ubicación'
                    )
                },


                {
                    /*
                     * Intentar obtener la máxima precisión
                     * disponible.
                     */
                    enableHighAccuracy: true,

                    /*
                     * Permitir una posición almacenada
                     * de hasta 5 segundos.
                     */
                    maximumAge: 5000,

                    /*
                     * Tiempo máximo para obtener
                     * una posición.
                     */
                    timeout: 10000,
                }
            )


        /*
         * Cuando el componente desaparezca,
         * dejamos de escuchar el GPS.
         */
        return () => {

            navigator.geolocation.clearWatch(
                watchId
            )

        }

    }, [])


    /*
     * Mostrar error
     */
    if (error) {

        return (
            <div className="flex h-full w-full items-center justify-center">

                <p className="text-red-500">
                    {error}
                </p>

            </div>
        )
    }


    /*
     * Esperar a obtener la primera posición
     */
    if (!userLocation) {

        return (
            <div className="flex h-full w-full items-center justify-center">

                <p>
                    Obteniendo ubicación...
                </p>

            </div>
        )
    }


    return (

        <div className="relative h-full w-full">

            <MapContainer
                center={userLocation}
                zoom={13}
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


                {/* Detectar zona visible */}

                <MapEvents
                    onBoundsChange={loadSprings}
                />


                {/* Ubicación actual del usuario */}

                <Marker
                    position={userLocation}
                    icon={userLocationIcon}
                >

                    <Popup>

                        <strong>
                            Tu ubicación
                        </strong>

                        <br />

                        Latitud:{' '}
                        {userLocation[0]}

                        <br />

                        Longitud:{' '}
                        {userLocation[1]}

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


                <div className="mt-1 text-xs">

                    📍{' '}

                    {userLocation[0].toFixed(6)},{' '}

                    {userLocation[1].toFixed(6)}

                </div>

            </div>

        </div>
    )
}


export default MapView