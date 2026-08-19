import {
    iconByType,
    emojiByType,
    userLocationIcon,
} from './icons'

import MarkerClusterGroup from 'react-leaflet-cluster'

import {
    memo,
    useCallback,
    useEffect,
    useState,
} from 'react'

import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import {
    getAllFeatures,
    searchFeatures,
} from '../../services/api'

import type {
    MountainFeature,
} from '../../services/api'

import useUserLocation from '../../hooks/useUserLocation'


/* =========================================================
   TIPOS
========================================================= */

interface MapBounds {
    minLat: number
    maxLat: number
    minLon: number
    maxLon: number
}


/* =========================================================
   COMPARAR FEATURES
========================================================= */

/*
 * Comprueba si dos arrays contienen exactamente
 * los mismos elementos según su ID.
 *
 * No importa el orden.
 */
function areFeaturesEqual(
    previous: MountainFeature[],
    next: MountainFeature[]
) {

    if (
        previous.length !==
        next.length
    ) {
        return false
    }


    const previousIds =
        new Set(
            previous.map(
                (feature) => feature.id
            )
        )


    return next.every(
        (feature) =>
            previousIds.has(
                feature.id
            )
    )
}


/* =========================================================
   MARKER
========================================================= */

const FeatureMarker = memo(
    function FeatureMarker({
        feature,
    }: {
        feature: MountainFeature
    }) {

        return (

            <Marker
                position={[
                    feature.latitude,
                    feature.longitude,
                ]}
                icon={
                    iconByType[
                    feature.type as keyof typeof iconByType
                    ] ??
                    userLocationIcon
                }
            >

                <Popup>

                    <div className="min-w-[140px] max-w-[180px]">

                        {/* Nombre */}

                        <h3 className="mb-1 text-sm font-bold leading-tight">

                            {emojiByType[
                                feature.type as keyof typeof emojiByType
                            ] ?? '📍'}{' '}

                            {feature.name ??
                                'Sin nombre'}

                        </h3>


                        {/* Coordenadas */}

                        <div className="space-y-0.5 text-xs">

                            <p>

                                {feature.latitude.toFixed(5)}

                                {', '}

                                {feature.longitude.toFixed(5)}

                            </p>

                        </div>


                        {/* Tags */}

                        {feature.tags && (

                            <div className="mt-1.5 border-t pt-1">

                                <div className="space-y-0.5 text-[10px] text-gray-600">

                                    {Object.entries(
                                        feature.tags
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

        )
    }
)


/* =========================================================
   EVENTOS DEL MAPA
========================================================= */

function MapEvents({
    onBoundsChange,
}: {
    onBoundsChange: (
        bounds: MapBounds,
        zoom: number
    ) => void
}) {

    const map = useMap()


    useEffect(() => {

        let timeoutId:
            number | undefined


        /*
         * Ejecutar cuando termina el movimiento
         */
        const handleMoveEnd = () => {

            /*
             * Cancelar cualquier ejecución pendiente
             */
            if (timeoutId !== undefined) {

                window.clearTimeout(
                    timeoutId
                )

            }


            /*
             * Esperar 250 ms antes de consultar
             *
             * Esto evita llamadas demasiado rápidas
             * si el usuario mueve el mapa varias veces.
             */
            timeoutId =
                window.setTimeout(() => {

                    const bounds =
                        map.getBounds()


                    onBoundsChange(
                        {
                            minLat:
                                bounds.getSouth(),

                            maxLat:
                                bounds.getNorth(),

                            minLon:
                                bounds.getWest(),

                            maxLon:
                                bounds.getEast(),
                        },

                        map.getZoom()
                    )

                }, 250)

        }


        map.on(
            'moveend',
            handleMoveEnd
        )


        /*
         * Cargar inicialmente
         */
        const initialBounds =
            map.getBounds()


        onBoundsChange(
            {
                minLat:
                    initialBounds.getSouth(),

                maxLat:
                    initialBounds.getNorth(),

                minLon:
                    initialBounds.getWest(),

                maxLon:
                    initialBounds.getEast(),
            },

            map.getZoom()
        )


        /*
         * Limpiar listeners
         */
        return () => {

            if (
                timeoutId !== undefined
            ) {

                window.clearTimeout(
                    timeoutId
                )

            }


            map.off(
                'moveend',
                handleMoveEnd
            )

        }

    }, [
        map,
        onBoundsChange,
    ])


    return null
}


/* =========================================================
   CONTROLADOR DE BÚSQUEDA
========================================================= */

function SearchController({
    feature,
}: {
    feature: MountainFeature | null
}) {

    const map = useMap()


    useEffect(() => {

        if (!feature) {
            return
        }


        map.flyTo(
            [
                feature.latitude,
                feature.longitude,
            ],
            16,
            {
                duration: 1.5,
            }
        )

    }, [
        feature,
        map,
    ])


    return null
}


/* =========================================================
   MAP VIEW
========================================================= */

function MapView() {

    /*
     * Ubicación del usuario
     */
    const {
        location: userLocation,
        error,
    } = useUserLocation({
        watch: true,
    })


    /*
     * Elementos visibles
     */
    const [
        features,
        setFeatures,
    ] = useState<MountainFeature[]>([])


    /*
     * Resultados de búsqueda
     */
    const [
        searchResults,
        setSearchResults,
    ] = useState<MountainFeature[]>([])


    /*
     * Zoom actual
     */
    const [
        zoom,
        setZoom,
    ] = useState<number>(13)


    /*
     * Texto de búsqueda
     */
    const [
        search,
        setSearch,
    ] = useState('')


    /*
     * Estado de búsqueda
     */
    const [
        searching,
        setSearching,
    ] = useState(false)


    /*
     * Elemento seleccionado
     */
    const [
        selectedFeature,
        setSelectedFeature,
    ] = useState<MountainFeature | null>(
        null
    )


    /* =====================================================
       CARGAR ELEMENTOS
    ===================================================== */

    const loadFeatures =
        useCallback(
            (
                bounds: MapBounds,
                currentZoom: number
            ) => {

                /*
                 * Actualizar zoom solamente
                 * si realmente ha cambiado.
                 */
                setZoom((previousZoom) =>
                    previousZoom === currentZoom
                        ? previousZoom
                        : currentZoom
                )


                /*
                 * Si estamos demasiado alejados,
                 * no mostramos elementos.
                 */
                if (
                    currentZoom < 12
                ) {

                    setFeatures((previous) =>
                        previous.length === 0
                            ? previous
                            : []
                    )

                    return
                }


                /*
                 * Consultar API
                 */
                getAllFeatures(
                    bounds.minLat,
                    bounds.maxLat,
                    bounds.minLon,
                    bounds.maxLon
                )
                    .then((data) => {

                        setFeatures(
                            (previous) => {

                                /*
                                 * Si los elementos
                                 * son exactamente los mismos,
                                 * conservar la referencia anterior.
                                 *
                                 * Esto es importante para evitar
                                 * reconstrucciones innecesarias
                                 * de MarkerClusterGroup.
                                 */
                                if (
                                    areFeaturesEqual(
                                        previous,
                                        data
                                    )
                                ) {

                                    return previous

                                }


                                return data

                            }
                        )

                    })
                    .catch((error) => {

                        console.error(
                            'Error cargando elementos:',
                            error
                        )

                    })

            },
            []
        )


    /* =====================================================
       BUSCADOR
    ===================================================== */

    useEffect(() => {

        /*
         * Sin texto
         */
        if (
            search.trim().length === 0
        ) {

            setSearchResults([])

            setSearching(false)

            return

        }


        /*
         * Mínimo dos caracteres
         */
        if (
            search.trim().length < 2
        ) {

            setSearchResults([])

            return

        }


        setSearching(true)


        /*
         * Debounce
         */
        const timeoutId =
            window.setTimeout(() => {

                searchFeatures(
                    search.trim()
                )
                    .then((data) => {

                        console.log(
                            'Resultados de búsqueda:',
                            data.length
                        )


                        setSearchResults(
                            data
                        )

                    })
                    .catch((error) => {

                        console.error(
                            'Error buscando elementos:',
                            error
                        )


                        setSearchResults(
                            []
                        )

                    })
                    .finally(() => {

                        setSearching(
                            false
                        )

                    })

            }, 300)


        /*
         * Cancelar búsqueda anterior
         */
        return () => {

            window.clearTimeout(
                timeoutId
            )

        }

    }, [search])


    /* =====================================================
       LÍMITES DE CATALUNYA
    ===================================================== */

    const catalunyaBounds: [
        [number, number],
        [number, number]
    ] = [

            [
                40.5,
                0.15,
            ],

            [
                42.9,
                3.35,
            ],

        ]


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {

        return (

            <div className="flex h-full w-full items-center justify-center">

                <p className="text-red-500">

                    {error}

                </p>

            </div>

        )

    }


    /* =====================================================
       ESPERANDO UBICACIÓN
    ===================================================== */

    if (!userLocation) {

        return (

            <div className="flex h-full w-full items-center justify-center">

                <p>
                    Obteniendo ubicación...
                </p>

            </div>

        )

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="relative h-full w-full">


            {/* ==========================================
                BUSCADOR
            ========================================== */}

            <div className="absolute left-16 top-4 z-[1000] w-80">

                <input
                    type="text"
                    value={search}
                    onChange={(event) => {

                        setSearch(
                            event.target.value
                        )


                        setSelectedFeature(
                            null
                        )

                    }}
                    placeholder="Buscar fuente, pico, refugio..."
                    className="w-full rounded-lg border bg-white px-4 py-3 shadow-lg outline-none focus:ring-2 focus:ring-blue-500"
                />


                {/* BUSCANDO */}

                {searching && (

                    <div className="mt-1 rounded-lg bg-white p-3 text-sm text-gray-500 shadow-lg">

                        Buscando...

                    </div>

                )}


                {/* RESULTADOS */}

                {!searching &&
                    search.length >= 2 &&
                    searchResults.length > 0 && (

                        <div className="mt-1 max-h-80 overflow-y-auto rounded-lg bg-white shadow-lg">

                            {searchResults.map(
                                (feature) => (

                                    <button
                                        key={
                                            feature.id
                                        }
                                        type="button"
                                        onClick={() => {

                                            setSelectedFeature(
                                                feature
                                            )


                                            setSearch(
                                                feature.name ??
                                                ''
                                            )


                                            setSearchResults(
                                                []
                                            )

                                        }}
                                        className="w-full border-b p-3 text-left hover:bg-gray-100"
                                    >

                                        <div className="font-semibold">

                                            {emojiByType[
                                                feature.type as keyof typeof emojiByType
                                            ] ?? '📍'}{' '}

                                            {feature.name ??
                                                'Sin nombre'}

                                        </div>


                                        <div className="text-xs text-gray-500">

                                            {feature.latitude.toFixed(
                                                5
                                            )}

                                            {', '}

                                            {feature.longitude.toFixed(
                                                5
                                            )}

                                        </div>

                                    </button>

                                )
                            )}

                        </div>

                    )}


                {/* SIN RESULTADOS */}

                {!searching &&
                    search.length >= 2 &&
                    searchResults.length === 0 && (

                        <div className="mt-1 rounded-lg bg-white p-4 text-sm text-gray-500 shadow-lg">

                            No se han encontrado resultados.

                        </div>

                    )}

            </div>


            {/* ==========================================
                MAPA
            ========================================== */}

            <MapContainer
                center={userLocation}
                zoom={13}
                minZoom={8}
                scrollWheelZoom={true}
                maxBounds={catalunyaBounds}
                maxBoundsViscosity={1.0}
                className="h-full w-full"
            >


                {/* CONTROLADOR DE BÚSQUEDA */}

                <SearchController
                    feature={
                        selectedFeature
                    }
                />


                {/* OPEN STREET MAP */}

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                {/* EVENTOS */}

                <MapEvents
                    onBoundsChange={
                        loadFeatures
                    }
                />


                {/* ======================================
                    UBICACIÓN DEL USUARIO
                ====================================== */}

                <Marker
                    position={
                        userLocation
                    }
                    icon={
                        userLocationIcon
                    }
                >

                    <Popup>

                        <strong>
                            Tu ubicación
                        </strong>

                        <br />

                        Latitud:{' '}

                        {
                            userLocation[0]
                        }

                        <br />

                        Longitud:{' '}

                        {
                            userLocation[1]
                        }

                    </Popup>

                </Marker>


                {/* ======================================
                    ELEMENTOS
                ====================================== */}

                <MarkerClusterGroup
                    disableClusteringAtZoom={16}
                >

                    {features.map(
                        (feature) => (

                            <FeatureMarker
                                key={feature.id}
                                feature={feature}
                            />

                        )
                    )}

                </MarkerClusterGroup>

            </MapContainer>


            {/* ==========================================
                INFORMACIÓN
            ========================================== */}

            <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white p-4 shadow-lg">

                <div>

                    <strong>
                        Elementos:{' '}
                        {
                            features.length
                        }
                    </strong>

                </div>


                <div>
                    Zoom:{' '}
                    {zoom}
                </div>


                <div className="mt-1 text-xs">

                    📍{' '}

                    {
                        userLocation[0].toFixed(
                            6
                        )
                    }

                    {', '}

                    {
                        userLocation[1].toFixed(
                            6
                        )
                    }

                </div>

            </div>

        </div>

    )

}


export default MapView