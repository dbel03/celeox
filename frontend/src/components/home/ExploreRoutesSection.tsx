const Routes = [
    { id: 1, name: 'Montcau clásica', distance: '9.2 km', elevation: '620 m' },
    { id: 2, name: 'Vallparadís río', distance: '4.5 km', elevation: '120 m' },
    { id: 3, name: 'Pirineos - Refugio', distance: '14 km', elevation: '980 m' },
]

function ExploreRoutesSection() {
    return (
        <div className="flex h-[500px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
                <h3 className="text-xl font-bold text-slate-900">
                    Rutas
                </h3>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
                {Routes.map((route) => (
                    <button
                        key={route.id}
                        type="button"
                        className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                            🥾
                        </div>

                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                                {route.name}
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                                📏 {route.distance} · ⛰️ {route.elevation}
                            </p>
                        </div>

                        <span className="text-slate-300 transition group-hover:text-emerald-500">
                            →
                        </span>
                    </button>
                ))}
            </div>

            <button
                type="button"
                className="mt-5 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
                Ver Rutas
            </button>

        </div>
    )
}

export default ExploreRoutesSection