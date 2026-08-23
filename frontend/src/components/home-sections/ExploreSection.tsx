import MapPreview from '../shared/MapPreview'


const ExcursionGroups = [
  {
    id: 1,
    name: 'Los Exploradores del moco',
    location: 'Excursión al Montcau',
    members: 4,
  },
  {
    id: 2,
    name: 'Los cracks',
    location: 'Excursión a los pirineos',
    members: 3,
  },
  {
    id: 3,
    name: 'Guapiabuelas',
    location: 'Excursión a Vallparadis',
    members: 5,
  },
]


interface ExploreSectionProps {
  onOpenMap?: () => void
}


function ExploreSection({
  onOpenMap,
}: ExploreSectionProps) {

  return (
    <section className="bg-slate-50 px-6 py-20 lg:px-12">

      <div className="mx-auto max-w-7xl">

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

          <div className="relative h-[500px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <MapPreview
              onClick={onOpenMap}
            />

          </div>

          <div className="flex h-[500px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">

              <h3 className="text-xl font-bold text-slate-900">
                Grupos de excursión
              </h3>

            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">

              {ExcursionGroups.map((center) => (

                <button
                  key={center.id}
                  type="button"
                  className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    🏔️
                  </div>

                  <div className="min-w-0 flex-1">

                    <h4 className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                      {center.name}
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      📍 {center.location}
                    </p>

                  </div>
                  
                  <span className="text-slate-300 transition group-hover:text-emerald-500">
                    →
                  </span>

                </button>

              ))}

            </div>


            {/* Botón */}

            <button
              type="button"
              className="mt-5 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Explorar Grupos
            </button>

          </div>

        </div>

      </div>

    </section>
  )
}


export default ExploreSection