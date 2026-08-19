const stats = [
  {
    value: '1.250+',
    label: 'Excursiones',
    icon: '🥾',
  },
  {
    value: '8.500+',
    label: 'Excursionistas',
    icon: '👥',
  },
  {
    value: '75',
    label: 'Centros',
    icon: '🏔️',
  },
  {
    value: '42.000+',
    label: 'Km recorridos',
    icon: '📍',
  },
]

function StatsSection() {
  return (
    <section className="bg-slate-950 px-6 py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">

        {/* Cabecera */}
        <div className="mx-auto mb-12 max-w-2xl text-center">

          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
            Celeox en números
          </span>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Una comunidad en movimiento
          </h2>

          <p className="mt-3 text-slate-400">
            Cada ruta cuenta una historia.
          </p>

        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition hover:bg-white/10"
            >

              <div className="text-3xl">
                {stat.icon}
              </div>

              <p className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                {stat.value}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {stat.label}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  )
}

export default StatsSection