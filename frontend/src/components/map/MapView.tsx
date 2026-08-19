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

import type { Marker as LeafletMarker } from 'leaflet'

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

function areFeaturesEqual(
    previous: MountainFeature[],
    next: MountainFeature[]
) {

    if (previous.length !== next.length) {
        return false
    }

    const previousIds = new Set(previous.map((feature) => feature.id))

    return next.every((feature) => previousIds.has(feature.id))
}


/* =========================================================
   MARKER
========================================================= */

/*
 * Marcador individual. Ya no usa Popup: toda la información
 * se muestra en el FeatureDetailPanel lateral.
 *
 * El icono "grande" se muestra cuando este feature es el que
 * está actualmente abierto en el panel de detalle (isDetailOpen),
 * o cuando viene seleccionado desde el buscador (selected, rojo).
 */
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
        onOpenDetail: (feature: MountainFeature) => void
    }) {

        const markerRef = useRef<LeafletMarker | null>(null)

        const icon = selected
            ? selectedFeatureIcon
            : isDetailOpen
                ? iconByType[feature.type as keyof typeof iconByType] ?? userLocationIcon
                : smallIconByType[feature.type as keyof typeof smallIconByType] ?? userLocationIcon

        return (
            <Marker
                ref={markerRef}
                position={[feature.latitude, feature.longitude]}
                icon={icon}
                eventHandlers={{
                    click: () => onOpenDetail(feature),
                }}
            />
        )
    }
)


/* =========================================================
   EVENTOS DEL MAPA
========================================================= */

function MapEvents({
    onBoundsChange,
}: {
    onBoundsChange: (bounds: MapBounds, zoom: number) => void
}) {

    const map = useMap()

    useEffect(() => {

        let timeoutId: number | undefined

        const handleMoveEnd = () => {

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId)
            }

            timeoutId = window.setTimeout(() => {

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

            }, 250)

        }

        map.on('moveend', handleMoveEnd)

        const initialBounds = map.getBounds()

        onBoundsChange(
            {
                minLat: initialBounds.getSouth(),
                maxLat: initialBounds.getNorth(),
                minLon: initialBounds.getWest(),
                maxLon: initialBounds.getEast(),
            },
            map.getZoom()
        )

        return () => {

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId)
            }

            map.off('moveend', handleMoveEnd)

        }

    }, [map, onBoundsChange])

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
            [feature.latitude, feature.longitude],
            17,
            { duration: 1.5 }
        )

    }, [feature, map])

    return null
}


/* =========================================================
   MAP VIEW
========================================================= */

function MapView() {

    const { location: userLocation, error } = useUserLocation({ watch: true })

    const [features, setFeatures] = useState<MountainFeature[]>([])

    const [searchResults, setSearchResults] = useState<MountainFeature[]>([])

    const [zoom, setZoom] = useState<number>(13)

    const [search, setSearch] = useState('')

    const [searching, setSearching] = useState(false)

    /*
     * Elemento seleccionado desde el buscador (marcador rojo destacado)
     */
    const [selectedFeature, setSelectedFeature] = useState<MountainFeature | null>(null)

    /*
     * Elemento mostrado en el panel de detalle (derecha)
     */
    const [detailFeature, setDetailFeature] = useState<MountainFeature | null>(null)


    /* =====================================================
       CARGAR ELEMENTOS
    ===================================================== */

    const loadFeatures = useCallback(
        (bounds: MapBounds, currentZoom: number) => {

            setZoom((previousZoom) =>
                previousZoom === currentZoom ? previousZoom : currentZoom
            )

            if (currentZoom < 12) {

                setFeatures((previous) => (previous.length === 0 ? previous : []))

                return
            }

            getAllFeatures(
                bounds.minLat,
                bounds.maxLat,
                bounds.minLon,
                bounds.maxLon
            )
                .then((data) => {

                    setFeatures((previous) => {

                        if (areFeaturesEqual(previous, data)) {
                            return previous
                        }

                        return data

                    })

                })
                .catch((error) => {

                    console.error('Error cargando elementos:', error)

                })

        },
        []
    )


    /* =====================================================
       QUITAR SELECCIÓN AUTOMÁTICAMENTE
    ===================================================== */

    useEffect(() => {

        if (!selectedFeature) {
            return
        }

        const timeoutId = window.setTimeout(() => {

            setSelectedFeature(null)

        }, 5000)

        return () => {

            window.clearTimeout(timeoutId)

        }

    }, [selectedFeature])


    /* =====================================================
       BUSCADOR
    ===================================================== */

    useEffect(() => {

        if (search.trim().length === 0) {

            setSearchResults([])
            setSearching(false)

            return
        }

        if (search.trim().length < 2) {

            setSearchResults([])
            setSearching(false)

            return
        }

        setSearching(true)

        const timeoutId = window.setTimeout(() => {

            searchFeatures(search.trim())
                .then((data) => {

                    console.log('Resultados de búsqueda:', data.length)

                    setSearchResults(data)

                })
                .catch((error) => {

                    console.error('Error buscando elementos:', error)

                    setSearchResults([])

                })
                .finally(() => {

                    setSearching(false)

                })

        }, 300)

        return () => {

            window.clearTimeout(timeoutId)

        }

    }, [search])


    /* =====================================================
       LÍMITES DE CATALUNYA
    ===================================================== */

    const catalunyaBounds: [[number, number], [number, number]] = [
        [40.5, 0.15],
        [42.9, 3.35],
    ]


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {

        return (
            <div className="flex h-full w-full items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        )

    }


    /* =====================================================
       ESPERANDO UBICACIÓN
    ===================================================== */

    if (!userLocation) {

        return (
            <div className="flex h-full w-full items-center justify-center">
                <p>Obteniendo ubicación...</p>
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

                        setSelectedFeature(null)

                        setSearch(event.target.value)

                    }}
                    placeholder="Buscar fuente, pico, refugio..."
                    className="w-full rounded-lg border bg-white px-4 py-3 shadow-lg outline-none focus:ring-2 focus:ring-blue-500"
                />

                {searching && (

                    <div className="mt-1 rounded-lg bg-white p-3 text-sm text-gray-500 shadow-lg">
                        Buscando...
                    </div>

                )}

                {!searching &&
                    search.trim().length >= 2 &&
                    searchResults.length > 0 && (

                        <div className="mt-1 max-h-80 overflow-y-auto rounded-lg bg-white shadow-lg">

                            {searchResults.map((feature) => (

                                <button
                                    key={feature.id}
                                    type="button"
                                    onClick={() => {

                                        setSelectedFeature(null)

                                        setFeatures((previous) => {

                                            const exists = previous.some(
                                                (item) => item.id === feature.id
                                            )

                                            if (exists) {
                                                return previous
                                            }

                                            return [...previous, feature]

                                        })

                                        setSelectedFeature(feature)

                                        setDetailFeature(feature)

                                        setSearch(feature.name ?? '')

                                        setSearchResults([])

                                    }}
                                    className="w-full border-b p-3 text-left hover:bg-gray-100"
                                >

                                    <div className="font-semibold">
                                        {feature.name ?? 'Sin nombre'}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        {feature.latitude.toFixed(5)}
                                        {', '}
                                        {feature.longitude.toFixed(5)}
                                    </div>

                                </button>

                            ))}

                        </div>

                    )}

                {!searching &&
                    search.trim().length >= 2 &&
                    searchResults.length === 0 &&
                    !selectedFeature && (

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

                <SearchController feature={selectedFeature} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents onBoundsChange={loadFeatures} />

                {/* UBICACIÓN DEL USUARIO — mantiene su propio Popup */}

                <Marker position={userLocation} icon={userLocationIcon}>

                    <Popup>

                        <strong>Tu ubicación</strong>

                        <br />

                        Latitud: {userLocation[0]}

                        <br />

                        Longitud: {userLocation[1]}

                    </Popup>

                </Marker>

                {/* ELEMENTOS */}

                <MarkerClusterGroup disableClusteringAtZoom={16}>

                    {features.map((feature) => (

                        <FeatureMarker
                            key={feature.id}
                            feature={feature}
                            selected={selectedFeature?.id === feature.id}
                            isDetailOpen={detailFeature?.id === feature.id}
                            onOpenDetail={setDetailFeature}
                        />

                    ))}

                </MarkerClusterGroup>

            </MapContainer>


            {/* ==========================================
                INFORMACIÓN
            ========================================== */}

            <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white p-4 shadow-lg">

                <div>
                    <strong>Elementos: {features.length}</strong>
                </div>

                <div>Zoom: {zoom}</div>

                <div className="mt-1 text-xs">
                    📍 {userLocation[0].toFixed(6)}
                    {', '}
                    {userLocation[1].toFixed(6)}
                </div>

            </div>


            {/* ==========================================
                PANEL DE DETALLE (derecha)
            ========================================== */}

            <FeatureDetailPanel
                feature={detailFeature}
                onClose={() => setDetailFeature(null)}
                onEdit={(feature) => {

                    console.log('Editar:', feature)

                    // Aquí conectarás tu formulario/modal de edición

                }}
                onDelete={(feature) => {

                    console.log('Eliminar:', feature)

                    // Aquí conectarás la llamada DELETE a tu API

                    setDetailFeature(null)

                }}
            />

        </div>

    )

}


export default MapView