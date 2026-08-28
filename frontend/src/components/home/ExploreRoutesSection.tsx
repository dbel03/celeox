import type { MountainRoute } from '../../types/route'

const Routes: MountainRoute[] = [
    {
        id: '1',
        name: 'Montcau clásica',
        distanceKm: 9.2,
        elevationGain: 620,
        totalTimeMinutes: 210,
        movingTimeMinutes: 180,
        criticalSection: 'Sendero/Corriol',
        personalRecommendations: null,
        track: [],
        segments: [],
        generalDifficulty: 'Moderada',
        technique: 'Sendero marcado',
        aerialExposure: 'Baja',
        notRecommendedFor: null,
        recommendedMaterial: null,
        votes: 34,
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
    },
    {
        id: '2',
        name: 'Vallparadís río',
        distanceKm: 4.5,
        elevationGain: 120,
        totalTimeMinutes: 90,
        movingTimeMinutes: 75,
        criticalSection: 'Pista',
        personalRecommendations: null,
        track: [],
        segments: [],
        generalDifficulty: 'Fácil',
        technique: 'Pista ancha',
        aerialExposure: 'Nula',
        notRecommendedFor: null,
        recommendedMaterial: null,
        votes: 51,
        createdAt: '2026-05-02T10:00:00Z',
        updatedAt: '2026-05-02T10:00:00Z',
    },
    {
        id: '3',
        name: 'Pirineos - Refugio',
        distanceKm: 14,
        elevationGain: 980,
        totalTimeMinutes: 360,
        movingTimeMinutes: 300,
        criticalSection: 'Roca vertical aérea',
        personalRecommendations: null,
        track: [],
        segments: [],
        generalDifficulty: 'Muy difícil',
        technique: 'Trepada, exposición aérea',
        aerialExposure: 'Alta',
        notRecommendedFor: null,
        recommendedMaterial: null,
        votes: 22,
        createdAt: '2026-05-03T10:00:00Z',
        updatedAt: '2026-05-03T10:00:00Z',
    },
]

interface ExploreRoutesSectionProps {
    onOpenRoutes?: () => void
}

function ExploreRoutesSection({
    onOpenRoutes,
}: ExploreRoutesSectionProps) {
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
                        onClick={onOpenRoutes}
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
                                📏 {route.distanceKm} km · ⛰️ {route.elevationGain} m
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
                onClick={onOpenRoutes}
                className="mt-5 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
                Ver Rutas
            </button>

        </div>
    )
}

export default ExploreRoutesSection