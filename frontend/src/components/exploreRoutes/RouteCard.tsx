import type { MountainRoute } from '../../types/route'

interface RouteCardProps {
    route: MountainRoute
    onClick?: () => void
}

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) return `${mins} min`
    if (mins === 0) return `${hours} h`
    return `${hours} h ${mins} min`
}

function RouteCard({ route, onClick }: RouteCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
        >
            <div className="flex h-32 items-center justify-center bg-emerald-50 text-3xl">
                🥾
            </div>

            <div className="p-4">
                <h4 className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                    {route.name}
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                    📏 {route.distanceKm} km · ⛰️ {route.elevationGain} m
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    ⏱️ {formatDuration(route.totalTimeMinutes)}
                </p>

                <span className="mt-2 inline-flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {route.generalDifficulty}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        👍 {route.votes}
                    </span>
                </span>
            </div>
        </button>
    )
}

export default RouteCard