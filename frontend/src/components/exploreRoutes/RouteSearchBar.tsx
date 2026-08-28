interface RoutesSearchBarProps {
    value: string
    onChange: (value: string) => void
}

function RoutesSearchBar({ value, onChange }: RoutesSearchBarProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Buscar rutas..."
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-300 focus:outline-none"
            />

            <div className="flex gap-2">
                <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                >
                    Distancia
                </button>
                <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                >
                    Desnivel
                </button>
                <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                >
                    Dificultad
                </button>
            </div>

        </div>
    )
}

export default RoutesSearchBar