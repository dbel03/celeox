import {
    iconByType,
    smallIconByType,
    userLocationIcon,
    selectedFeatureIcon,
} from './icons'

import FeatureDetailPanel from './FeatureDetailPanel'

import MarkerClusterGroup from 'react-leaflet-cluster'

import {
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
} from 'react-leaflet'

import type {
    Marker as LeafletMarker,
    Map as LeafletMap,
} from 'leaflet'

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


interface MapLayer {
    id: string
    name: string
    url: string
    attribution: string
}

interface MapViewProps {
    onDetailOpenChange?: (open: boolean) => void
}

/* =========================================================
   CAPAS
========================================================= */

const mapLayers: MapLayer[] = [

    {
        id: 'osm',
        name: 'OpenStreetMap',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },

    {
        id: 'satellite',
        name: 'Satélite',
        url:
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution:
            'Tiles &copy; Esri',
    },

    {
        id: 'ign',
        name: 'IGN España',
        url:
            'https://www.ign.es/wmts/pnoa-ma/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&format=image/jpeg&TileMatrix={z}&TileRow={y}&TileCol={x}',
        attribution:
            '&copy; Instituto Geográfico Nacional de España',
    },

]


/* =========================================================
   UBICACIÓN
========================================================= */

const LOCATION_TIMEOUT_MS = 8000

const catalunyaCenter: [number, number] = [41.7, 1.75]


/* =========================================================
   COMPARAR FEATURES
========================================================= */

function areFeaturesEqual(
    previous: MountainFeature[],
    next: MountainFeature[]
) {

    if (previous.length !== next.length) {
        return false
    }

    const previousIds = new Set(
        previous.map((feature) => feature.id)
    )

    return next.every(
        (feature) => previousIds.has(feature.id)
    )
}


/* =========================================================
   MARKER
========================================================= */

const FeatureMarker = memo(
    function FeatureMarker({
        feature,
        selected,
        isDetailOpen,
        onOpenDetail,
    }: {
        feature: MountainFeature
        selected: boolean
        isDetailOpen: boolean
        onOpenDetail: (
            feature: MountainFeature
        ) => void
    }) {

        const markerRef =
            useRef<LeafletMarker | null>(null)

        const icon = selected
            ? selectedFeatureIcon
            : isDetailOpen
                ? iconByType[
                feature.type as keyof typeof iconByType
                ] ?? userLocationIcon
                : smallIconByType[
                feature.type as keyof typeof smallIconByType
                ] ?? userLocationIcon


        return (

            <Marker
                ref={markerRef}
                position={[
                    feature.latitude,
                    feature.longitude,
                ]}
                icon={icon}
                eventHandlers={{
                    click: () =>
                        onOpenDetail(feature),
                }}
            />

        )
    }
)


/* =========================================================
   EVENTOS MAPA
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


        const handleMoveEnd = () => {

            if (
                timeoutId !== undefined
            ) {

                window.clearTimeout(
                    timeoutId
                )

            }


            timeoutId = window.setTimeout(() => {

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
    feature:
    | MountainFeature
    | null
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
            17,
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
   CONTROLADOR DE ZOOM
========================================================= */

function ZoomControl({
    map,
}: {
    map: LeafletMap | null
}) {

    return (

        <div
            className="
                flex
                h-11
                w-11
                flex-col
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-white
                shadow-lg
                box-border
            "
        >

            <button
                type="button"
                onClick={() => map?.zoomIn()}
                disabled={!map}
                aria-label="Acercar mapa"
                title="Acercar"
                className="
                    flex
                    h-[22px]
                    w-full
                    items-center
                    justify-center
                    border-b
                    border-gray-200
                    text-lg
                    font-semibold
                    leading-none
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    active:bg-gray-100
                "
            >
                +
            </button>


            <button
                type="button"
                onClick={() => map?.zoomOut()}
                disabled={!map}
                aria-label="Alejar mapa"
                title="Alejar"
                className="
                    flex
                    h-[22px]
                    w-full
                    items-center
                    justify-center
                    text-lg
                    font-semibold
                    leading-none
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    active:bg-gray-100
                "
            >
                −
            </button>

        </div>

    )
}


/* =========================================================
   CONTROLADOR DE UBICACIÓN
========================================================= */

function LocationController({
    location,
}: {
    location:
    | [number, number]
    | null
}) {

    const map = useMap()


    const centerOnLocation = () => {

        if (!location) {
            return
        }


        map.flyTo(
            location,
            15,
            {
                duration: 1,
            }
        )

    }


    return (

        <button
            type="button"
            onClick={centerOnLocation}
            disabled={!location}
            aria-label="Centrar en mi ubicación"
            title="Centrar en mi ubicación"
            className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                border
                border-gray-200
                bg-white
                text-gray-700
                shadow-lg
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
            "
        >

            <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >

                <circle
                    cx="12"
                    cy="12"
                    r="3"
                    strokeWidth="2"
                />

                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="
                        M12 2v3
                        M12 19v3
                        M2 12h3
                        M19 12h3
                    "
                />

            </svg>

        </button>

    )
}


/* =========================================================
   MAP VIEW
========================================================= */

function MapView({ onDetailOpenChange }: MapViewProps) {

    const {
        location: userLocation,
        error,
    } = useUserLocation({
        watch: true,
    })


    const [
        features,
        setFeatures,
    ] = useState<MountainFeature[]>([])


    const [
        searchResults,
        setSearchResults,
    ] = useState<MountainFeature[]>([])


    const [
        zoom,
        setZoom,
    ] = useState(13)


    const [
        search,
        setSearch,
    ] = useState('')


    const [
        searching,
        setSearching,
    ] = useState(false)


    const [
        searchActive,
        setSearchActive,
    ] = useState(false)


    const [
        selectedFeature,
        setSelectedFeature,
    ] = useState<MountainFeature | null>(null)


    const [
        detailFeature,
        setDetailFeature,
    ] = useState<MountainFeature | null>(null)


    const [
        selectedLayer,
        setSelectedLayer,
    ] = useState('osm')


    const [
        layersOpen,
        setLayersOpen,
    ] = useState(false)


    const [
        mapInstance,
        setMapInstance,
    ] = useState<LeafletMap | null>(null)


    /* =====================================================
       AVISO DE UBICACIÓN NO DISPONIBLE
       (timeout o error de permisos)
    ===================================================== */

    const [
        locationUnavailable,
        setLocationUnavailable,
    ] = useState(false)


    const [
        showLocationNotice,
        setShowLocationNotice,
    ] = useState(false)


    const [
        locationNoticeMessage,
        setLocationNoticeMessage,
    ] = useState('')


    /*
     * Si el navegador reporta un error (por ejemplo,
     * permiso denegado), no bloqueamos el mapa: mostramos
     * el aviso inmediatamente y dejamos cargar con el
     * centro de fallback.
     */
    useEffect(() => {

        if (!error) {
            return
        }


        setLocationUnavailable(true)

        setLocationNoticeMessage(
            'No hemos podido acceder a tu ubicación (permiso denegado o no disponible). Puedes explorar el mapa igualmente y activarla más tarde con el botón de ubicación.'
        )

        setShowLocationNotice(true)

    }, [
        error,
    ])


    /*
     * Si tras unos segundos no hay ubicación NI error
     * (el navegador sigue esperando respuesta del usuario
     * o del GPS), mostramos el mismo aviso por timeout.
     */
    useEffect(() => {

        if (userLocation || error) {
            return
        }


        const timeoutId =
            window.setTimeout(() => {

                setLocationUnavailable(true)

                setLocationNoticeMessage(
                    'No hemos podido obtener tu ubicación. Puedes explorar el mapa igualmente y recuperarla más tarde con el botón de ubicación.'
                )

                setShowLocationNotice(true)

            }, LOCATION_TIMEOUT_MS)


        return () => {

            window.clearTimeout(
                timeoutId
            )

        }

    }, [
        userLocation,
        error,
    ])


    /*
     * Si la ubicación llega más tarde (el usuario
     * acepta el permiso, o el GPS tarda pero responde),
     * ocultamos el aviso automáticamente.
     */
    useEffect(() => {

        if (userLocation) {

            setShowLocationNotice(
                false
            )

        }

    }, [
        userLocation,
    ])


    /* =====================================================el 
       DETECTAR MÓVIL
    ===================================================== */

    const [
        isMobile,
        setIsMobile,
    ] = useState(false)

    useEffect(() => {
        onDetailOpenChange?.(isMobile && Boolean(detailFeature))
    }, [isMobile, detailFeature, onDetailOpenChange])

    useEffect(() => {

        const mediaQuery =
            window.matchMedia(
                '(max-width: 639px)'
            )


        const updateIsMobile = () => {

            setIsMobile(
                mediaQuery.matches
            )

        }


        updateIsMobile()


        mediaQuery.addEventListener(
            'change',
            updateIsMobile
        )


        return () => {

            mediaQuery.removeEventListener(
                'change',
                updateIsMobile
            )

        }

    }, [])


    /* =====================================================
       REF DEL BUSCADOR
    ===================================================== */

    const searchSelectionRef =
        useRef(false)


    /* =====================================================
       CAPA ACTUAL
    ===================================================== */

    const currentLayer =
        mapLayers.find(
            (layer) =>
                layer.id === selectedLayer
        ) ?? mapLayers[0]


    /* =====================================================
       CARGAR ELEMENTOS
    ===================================================== */

    const requestIdRef =
        useRef(0)


    const loadFeatures =
        useCallback(
            (
                bounds: MapBounds,
                currentZoom: number
            ) => {

                setZoom(
                    (previousZoom) =>
                        previousZoom ===
                            currentZoom
                            ? previousZoom
                            : currentZoom
                )


                if (currentZoom < 12) {

                    requestIdRef.current += 1

                    setFeatures(
                        (previous) =>
                            previous.length === 0
                                ? previous
                                : []
                    )

                    return
                }


                const requestId =
                    ++requestIdRef.current


                getAllFeatures(
                    bounds.minLat,
                    bounds.maxLat,
                    bounds.minLon,
                    bounds.maxLon
                )
                    .then((data) => {

                        if (
                            requestId !==
                            requestIdRef.current
                        ) {

                            return

                        }


                        setFeatures(
                            (previous) => {

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
       QUITAR SELECCIÓN
    ===================================================== */

    useEffect(() => {

        if (!selectedFeature) {
            return
        }


        const timeoutId =
            window.setTimeout(
                () => {

                    setSelectedFeature(
                        null
                    )

                },
                5000
            )


        return () => {

            window.clearTimeout(
                timeoutId
            )

        }

    }, [
        selectedFeature,
    ])


    /* =====================================================
       BUSCADOR
    ===================================================== */

    useEffect(() => {

        if (
            searchSelectionRef.current
        ) {

            searchSelectionRef.current =
                false

            setSearchResults([])
            setSearching(false)

            return
        }


        const value =
            search.trim()


        if (
            value.length === 0
        ) {

            setSearchResults([])
            setSearching(false)
            setSearchActive(false)

            return
        }


        if (
            value.length < 2
        ) {

            setSearchResults([])
            setSearching(false)

            return
        }


        setSearchActive(true)
        setSearching(true)


        const timeoutId =
            window.setTimeout(
                () => {

                    searchFeatures(value)
                        .then((data) => {

                            setSearchResults(
                                data
                            )

                        })
                        .catch((error) => {

                            console.error(
                                'Error buscando elementos:',
                                error
                            )

                            setSearchResults([])
                        })
                        .finally(() => {

                            setSearching(
                                false
                            )

                        })

                },
                300
            )


        return () => {

            window.clearTimeout(
                timeoutId
            )

        }

    }, [
        search,
    ])


    /* =====================================================
       LÍMITES
    ===================================================== */

    const catalunyaBounds:
        [
            [number, number],
            [number, number]
        ] = [
            [40.5, 0.15],
            [42.9, 3.35],
        ]


    /* =====================================================
       ESPERANDO UBICACIÓN
    ===================================================== */

    if (!userLocation && !locationUnavailable) {

        return (

            <div
                className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                "
            >

                <p>
                    Obteniendo ubicación...
                </p>

            </div>

        )

    }


    /* =====================================================
       CENTRO DEL MAPA
    ===================================================== */

    const mapCenter =
        userLocation ?? catalunyaCenter


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div
            className="
                relative
                h-full
                w-full
                max-w-full
                overflow-hidden
            "
        >

            {/* =================================================
                AVISO DE UBICACIÓN NO DISPONIBLE
            ================================================= */}

            {showLocationNotice && (

                <div
                    className="
                        absolute
                        left-1/2
                        top-20
                        z-[1500]
                        w-[calc(100%-2rem)]
                        max-w-sm
                        -translate-x-1/2
                        rounded-xl
                        border
                        border-amber-200
                        bg-amber-50
                        p-4
                        shadow-xl
                    "
                >

                    <div
                        className="
                            flex
                            items-start
                            justify-between
                            gap-3
                        "
                    >

                        <p
                            className="
                                text-sm
                                text-amber-800
                            "
                        >
                            {locationNoticeMessage}
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                setShowLocationNotice(
                                    false
                                )
                            }
                            aria-label="Cerrar aviso"
                            className="
                                shrink-0
                                text-amber-500
                                hover:text-amber-700
                            "
                        >
                            ✕
                        </button>

                    </div>

                </div>

            )}


            {/* =================================================
                CONTROLES SUPERIORES
            ================================================= */}

            <div className="absolute left-4 right-20 top-5 z-[1000] flex items-center gap-2">

                {/* =================================================
                    BUSCADOR
                ================================================= */}

                <div
                    className="
                        relative
                        min-w-0
                        flex-1
                        sm:flex-none
                        sm:w-56
                    "
                >

                    <input
                        type="text"
                        value={search}
                        onChange={(event) => {

                            searchSelectionRef.current =
                                false

                            setSelectedFeature(
                                null
                            )

                            setSearchActive(
                                true
                            )

                            setSearch(
                                event.target.value
                            )

                        }}
                        placeholder="Buscar fuente, pico, refugio..."
                        className="
                            h-11
                            w-full
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            px-4
                            pr-10

                            text-base
                            sm:text-sm

                            text-gray-800
                            shadow-lg
                            outline-none
                            transition
                            focus:border-emerald-500
                            focus:ring-2
                            focus:ring-emerald-500/20
                        "
                    />


                    {/* BUSCANDO */}

                    {searching && (

                        <div
                            className="
                                absolute
                                right-3
                                top-1/2
                                -translate-y-1/2
                                text-xs
                                text-gray-400
                            "
                        >
                            ...
                        </div>

                    )}


                    {/* =================================================
                        RESULTADOS
                    ================================================= */}

                    {!searching &&
                        searchActive &&
                        search.trim().length >= 2 &&
                        searchResults.length > 0 && (

                            <div
                                className="
                                    absolute
                                    left-0
                                    right-0
                                    top-full
                                    mt-1
                                    max-h-80
                                    overflow-y-auto
                                    rounded-xl
                                    bg-white
                                    shadow-xl
                                "
                            >

                                {searchResults.map(
                                    (feature) => (

                                        <button
                                            key={
                                                feature.id
                                            }
                                            type="button"
                                            onClick={() => {

                                                searchSelectionRef.current =
                                                    true

                                                setSearchActive(
                                                    false
                                                )


                                                setFeatures(
                                                    (previous) => {

                                                        const exists =
                                                            previous.some(
                                                                (item) =>
                                                                    item.id ===
                                                                    feature.id
                                                            )


                                                        if (
                                                            exists
                                                        ) {

                                                            return previous

                                                        }


                                                        return [
                                                            ...previous,
                                                            feature,
                                                        ]

                                                    }
                                                )


                                                setSelectedFeature(
                                                    feature
                                                )


                                                if (!isMobile) {

                                                    setDetailFeature(
                                                        feature
                                                    )

                                                } else {

                                                    setDetailFeature(
                                                        null
                                                    )

                                                }


                                                setSearch(
                                                    feature.name ?? ''
                                                )


                                                setSearchResults(
                                                    []
                                                )

                                            }}
                                            className="
                                                w-full
                                                border-b
                                                border-gray-100
                                                p-3
                                                text-left
                                                transition
                                                hover:bg-gray-50
                                            "
                                        >

                                            <div
                                                className="
                                                    font-semibold
                                                    text-gray-800
                                                "
                                            >
                                                {
                                                    feature.name ??
                                                    'Sin nombre'
                                                }
                                            </div>


                                            <div
                                                className="
                                                    text-xs
                                                    text-gray-500
                                                "
                                            >
                                                {
                                                    feature.latitude.toFixed(
                                                        5
                                                    )
                                                }
                                                {', '}
                                                {
                                                    feature.longitude.toFixed(
                                                        5
                                                    )
                                                }
                                            </div>

                                        </button>

                                    )
                                )}

                            </div>

                        )}


                    {/* =================================================
                        SIN RESULTADOS
                    ================================================= */}

                    {searchActive &&
                        !searching &&
                        search.trim().length >= 2 &&
                        searchResults.length === 0 && (

                            <div
                                className="
                                    absolute
                                    left-0
                                    right-0
                                    top-full
                                    mt-1
                                    rounded-xl
                                    bg-white
                                    p-4
                                    text-sm
                                    text-gray-500
                                    shadow-xl
                                "
                            >
                                No se han encontrado resultados.
                            </div>

                        )}

                </div>


                {/* =================================================
                    CAPAS
                ================================================= */}

                <div className="relative shrink-0">

                    <button
                        type="button"
                        onClick={() =>
                            setLayersOpen(
                                (open) => !open
                            )
                        }
                        aria-label="Cambiar capa"
                        aria-expanded={layersOpen}
                        title="Capas del mapa"
                        className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            text-gray-700
                            shadow-lg
                            transition
                            hover:bg-gray-50
                            active:bg-gray-100
                        "
                    >

                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="
                                    M12 3l9 5-9 5-9-5 9-5z
                                    M3 12l9 5 9-5
                                    M3 16l9 5 9-5
                                "
                            />

                        </svg>

                    </button>


                    {layersOpen && (

                        <div
                            className="
                                absolute
                                left-0
                                top-12
                                z-[1010]
                                w-52
                                rounded-xl
                                border
                                border-gray-200
                                bg-white
                                p-2
                                shadow-xl
                            "
                        >

                            <div
                                className="
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-gray-400
                                "
                            >
                                Capas
                            </div>


                            {mapLayers.map(
                                (layer) => (

                                    <button
                                        key={
                                            layer.id
                                        }
                                        type="button"
                                        onClick={() => {

                                            setSelectedLayer(
                                                layer.id
                                            )

                                            setLayersOpen(
                                                false
                                            )

                                        }}
                                        className={`
                                            flex
                                            w-full
                                            items-center
                                            justify-between
                                            rounded-lg
                                            px-3
                                            py-2.5
                                            text-left
                                            text-sm
                                            transition

                                            ${selectedLayer ===
                                                layer.id
                                                ? 'bg-emerald-50 font-semibold text-emerald-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }
                                        `}
                                    >

                                        <span>
                                            {
                                                layer.name
                                            }
                                        </span>


                                        {selectedLayer ===
                                            layer.id && (

                                                <span>
                                                    ✓
                                                </span>

                                            )}

                                    </button>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    ZOOM
                ================================================= */}

                <ZoomControl
                    map={mapInstance}
                />

            </div>


            {/* =================================================
                MAPA
            ================================================= */}

            <MapContainer
                ref={(instance) => {

                    if (instance) {

                        setMapInstance(
                            (previous) =>
                                previous === instance
                                    ? previous
                                    : instance
                        )

                    }

                }}
                center={mapCenter}
                zoom={13}
                zoomControl={false}
                minZoom={8}
                scrollWheelZoom={true}
                maxBounds={catalunyaBounds}
                maxBoundsViscosity={1.0}
                className="
                    h-full
                    w-full
                    max-w-full
                "
            >

                <SearchController
                    feature={
                        selectedFeature
                    }
                />


                <TileLayer
                    key={
                        currentLayer.id
                    }
                    attribution={
                        currentLayer.attribution
                    }
                    url={
                        currentLayer.url
                    }
                />


                <MapEvents
                    onBoundsChange={
                        loadFeatures
                    }
                />


                {/* =================================================
                    CONTROLES INFERIORES
                ================================================= */}

                <div
                    className="
                        absolute
                        bottom-5
                        right-4
                        z-[1000]
                        flex
                        flex-col
                        gap-2
                    "
                >

                    <LocationController
                        location={
                            userLocation
                        }
                    />

                </div>


                {/* =================================================
                    UBICACIÓN
                ================================================= */}

                {userLocation && (

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

                )}


                {/* =================================================
                    ELEMENTOS
                ================================================= */}

                <MarkerClusterGroup
                    disableClusteringAtZoom={16}
                >

                    {features.map(
                        (feature) => (

                            <FeatureMarker
                                key={
                                    feature.id
                                }
                                feature={
                                    feature
                                }
                                selected={
                                    selectedFeature?.id ===
                                    feature.id
                                }
                                isDetailOpen={
                                    detailFeature?.id ===
                                    feature.id
                                }
                                onOpenDetail={
                                    setDetailFeature
                                }
                            />

                        )
                    )}

                </MarkerClusterGroup>

            </MapContainer>


            {/* =================================================
                INFORMACIÓN
            ================================================= */}

            <div
                className="
                    absolute
                    bottom-4
                    left-4
                    z-[1000]
                    hidden
                    rounded-xl
                    bg-white/95
                    p-4
                    shadow-lg
                    backdrop-blur
                    sm:block
                "
            >

                <div>
                    <strong>
                        Elementos: {
                            features.length
                        }
                    </strong>
                </div>


                <div>
                    Zoom: {zoom}
                </div>


                {userLocation && (

                    <div
                        className="
                            mt-1
                            text-xs
                            text-gray-500
                        "
                    >
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

                )}

            </div>


            {/* =================================================
                PANEL DETALLE
            ================================================= */}

            <FeatureDetailPanel
                feature={
                    detailFeature
                }
                onClose={() =>
                    setDetailFeature(
                        null
                    )
                }
                onEdit={(feature) => {

                    console.log(
                        'Editar:',
                        feature
                    )

                }}
                onDelete={(feature) => {

                    console.log(
                        'Eliminar:',
                        feature
                    )

                    setDetailFeature(
                        null
                    )

                }}
            />

        </div>

    )
}


export default MapView