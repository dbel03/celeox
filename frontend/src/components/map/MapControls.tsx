import { useState } from 'react'

interface MapTopControlsProps {
    search: string
    onSearchChange: (value: string) => void
    searching: boolean
    searchResults: any[]
    onSelectFeature: (feature: any) => void
}

function MapTopControls({
    search,
    onSearchChange,
    searching,
    searchResults,
    onSelectFeature,
}: MapTopControlsProps) {

    const [layersOpen, setLayersOpen] = useState(false)

    return (
        <div
            className="
                absolute
                left-4
                top-4
                z-[1000]
                flex
                items-start
                gap-2
            "
        >

            {/* =====================================================
                BUSCADOR
            ===================================================== */}

            <div className="relative w-80">

                <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                        onSearchChange(event.target.value)
                    }
                    placeholder="Buscar fuente, pico, refugio..."
                    className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        pr-10
                        text-sm
                        text-slate-800
                        shadow-lg
                        outline-none
                        transition
                        focus:border-emerald-500
                        focus:ring-2
                        focus:ring-emerald-500/20
                    "
                />

                {searching && (
                    <div
                        className="
                            absolute
                            left-0
                            right-0
                            top-full
                            mt-2
                            rounded-xl
                            bg-white
                            p-3
                            text-sm
                            text-gray-500
                            shadow-lg
                        "
                    >
                        Buscando...
                    </div>
                )}

                {!searching &&
                    search.trim().length >= 2 &&
                    searchResults.length > 0 && (

                        <div
                            className="
                                absolute
                                left-0
                                right-0
                                top-full
                                mt-2
                                max-h-80
                                overflow-y-auto
                                rounded-xl
                                bg-white
                                shadow-xl
                            "
                        >

                            {searchResults.map((feature) => (

                                <button
                                    key={feature.id}
                                    type="button"
                                    onClick={() =>
                                        onSelectFeature(feature)
                                    }
                                    className="
                                        w-full
                                        border-b
                                        p-3
                                        text-left
                                        transition
                                        last:border-b-0
                                        hover:bg-emerald-50
                                    "
                                >

                                    <div className="font-semibold text-slate-800">
                                        {feature.name ?? 'Sin nombre'}
                                    </div>

                                    <div className="text-xs text-slate-500">
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
                    searchResults.length === 0 && (

                        <div
                            className="
                                absolute
                                left-0
                                right-0
                                top-full
                                mt-2
                                rounded-xl
                                bg-white
                                p-4
                                text-sm
                                text-gray-500
                                shadow-lg
                            "
                        >
                            No se han encontrado resultados.
                        </div>
                    )}

            </div>


            {/* =====================================================
                CAPAS
            ===================================================== */}

            <div className="relative">

                <button
                    type="button"
                    onClick={() =>
                        setLayersOpen((open) => !open)
                    }
                    className="
                        flex
                        h-[46px]
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        text-sm
                        font-semibold
                        text-slate-700
                        shadow-lg
                        transition
                        hover:bg-slate-50
                        active:scale-95
                    "
                >

                    <span className="text-lg">
                        🗺️
                    </span>

                    <span className="hidden sm:block">
                        Capas
                    </span>

                </button>


                {layersOpen && (

                    <div
                        className="
                            absolute
                            left-0
                            top-full
                            mt-2
                            w-64
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            p-3
                            shadow-xl
                        "
                    >

                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Capas del mapa
                        </div>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">

                            <input
                                type="radio"
                                name="map-layer"
                                defaultChecked
                            />

                            <span className="text-sm">
                                OpenStreetMap
                            </span>

                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">

                            <input
                                type="radio"
                                name="map-layer"
                            />

                            <span className="text-sm">
                                IGN
                            </span>

                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">

                            <input
                                type="radio"
                                name="map-layer"
                            />

                            <span className="text-sm">
                                Satélite
                            </span>

                        </label>

                    </div>
                )}

            </div>

        </div>
    )
}

export default MapTopControls