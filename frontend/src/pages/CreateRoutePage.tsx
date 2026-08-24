import {
    useState,
} from 'react'

import {
    MapContainer,
    TileLayer,
} from 'react-leaflet'

import type {
    LatLngExpression,
} from 'leaflet'

import RouteDrawing from '../components/map/RouteDrawing'

import type {
    RoutePoint,
} from '../components/map/RouteDrawing'

import AppNavbar from '../navigation/AppNavbar'

import 'leaflet/dist/leaflet.css'


/* =========================================================
   CAPAS
========================================================= */

const mapCenter: LatLngExpression = [
    41.7,
    1.75,
]


const catalunyaBounds:
    [
        [number, number],
        [number, number]
    ] = [
        [40.5, 0.15],
        [42.9, 3.35],
    ]


/* =========================================================
   PAGE
========================================================= */

function CreateRoutePage() {

    const [
        routeTrack,
        setRouteTrack,
    ] = useState<RoutePoint[]>([])


    const [
        drawing,
        setDrawing,
    ] = useState(true)


    /* =====================================================
       DESHACER ÚLTIMO PUNTO
    ===================================================== */

    const undoLastPoint = () => {

        setRouteTrack(
            (previous) =>
                previous.slice(
                    0,
                    -1
                )
        )

    }


    /* =====================================================
       BORRAR RUTA
    ===================================================== */

    const clearRoute = () => {

        setRouteTrack([])

    }


    return (

        <div
            className="
                relative
                h-screen
                w-full
                overflow-hidden
            "
        >

            {/* =================================================
                NAVBAR
            ================================================= */}

            <AppNavbar
                floating
            />


            {/* =================================================
                MAPA
            ================================================= */}

            <MapContainer
                center={mapCenter}
                zoom={10}
                zoomControl={true}
                scrollWheelZoom={true}
                maxBounds={catalunyaBounds}
                maxBoundsViscosity={1.0}
                className="
                    h-full
                    w-full
                "
            >

                <TileLayer
                    attribution="
                        &copy; OpenStreetMap contributors
                    "
                    url="
                        https://tile.openstreetmap.org/{z}/{x}/{y}.png
                    "
                />


                <RouteDrawing
                    active={drawing}
                    points={routeTrack}
                    onChange={setRouteTrack}
                />

            </MapContainer>


            {/* =================================================
                PANEL DE CREACIÓN
            ================================================= */}

            <div
                className="
                    absolute
                    left-4
                    top-20
                    z-[1000]
                    w-[calc(100%-2rem)]
                    max-w-sm
                    rounded-2xl
                    bg-white
                    p-4
                    shadow-xl
                "
            >

                <div
                    className="
                        mb-3
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div>

                        <h1
                            className="
                                text-lg
                                font-bold
                                text-gray-800
                            "
                        >
                            Crear ruta
                        </h1>

                        <p
                            className="
                                text-sm
                                text-gray-500
                            "
                        >
                            Haz clic sobre el mapa para añadir puntos.
                        </p>

                    </div>

                </div>


                {/* =================================================
                    ESTADO
                ================================================= */}

                <div
                    className="
                        mb-3
                        rounded-xl
                        bg-gray-50
                        p-3
                    "
                >

                    <div
                        className="
                            text-sm
                            text-gray-600
                        "
                    >
                        Puntos:

                        <span
                            className="
                                ml-1
                                font-semibold
                                text-gray-800
                            "
                        >
                            {routeTrack.length}
                        </span>

                    </div>

                </div>


                {/* =================================================
                    BOTONES
                ================================================= */}

                <div
                    className="
                        flex
                        gap-2
                    "
                >

                    <button
                        type="button"
                        onClick={undoLastPoint}
                        disabled={
                            routeTrack.length === 0
                        }
                        className="
                            flex-1
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            px-3
                            py-2
                            text-sm
                            font-medium
                            text-gray-700
                            shadow-sm
                            transition
                            hover:bg-gray-50
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                    >
                        Deshacer
                    </button>


                    <button
                        type="button"
                        onClick={clearRoute}
                        disabled={
                            routeTrack.length === 0
                        }
                        className="
                            flex-1
                            rounded-xl
                            border
                            border-red-200
                            bg-white
                            px-3
                            py-2
                            text-sm
                            font-medium
                            text-red-600
                            shadow-sm
                            transition
                            hover:bg-red-50
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                        "
                    >
                        Borrar
                    </button>

                </div>


                {/* =================================================
                    ACTIVAR / DESACTIVAR
                ================================================= */}

                <button
                    type="button"
                    onClick={() =>
                        setDrawing(
                            (previous) =>
                                !previous
                        )
                    }
                    className={`
                        mt-2
                        w-full
                        rounded-xl
                        px-3
                        py-2.5
                        text-sm
                        font-semibold
                        text-white
                        shadow-sm
                        transition

                        ${
                            drawing
                                ? 'bg-emerald-600 hover:bg-emerald-500'
                                : 'bg-gray-700 hover:bg-gray-600'
                        }
                    `}
                >

                    {drawing
                        ? 'Terminar dibujo'
                        : 'Continuar dibujando'
                    }

                </button>

            </div>

        </div>

    )
}


export default CreateRoutePage