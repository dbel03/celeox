interface HeaderProps {
  onCreateExcursion?: () => void
  onLogin?: () => void
}

function Header({
  onCreateExcursion,
  onLogin,
}: HeaderProps) {

  return (
    <header className="relative min-h-[300px] overflow-hidden">

      {/* Imagen de montaña */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/mountain-hero.jpg')",
        }}
      />

      {/* Oscurecer la imagen */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Degradado inferior */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Contenido superior */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <button type="button" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <img
            src="/images/logo.png"
            alt="Celeox logo"
            className="h-8 w-8"
          />
          <span>
            <span className="text-emerald-500">CELE</span>
            <span className="text-white">OX</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
        >
          Iniciar sesión
        </button>
      </div>

      {/* Contenido central */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-8 text-center">
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Bienvenido a Celeox
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          Descubre rutas, crea excursiones y comparte tus aventuras con la comunidad.
        </p>

        <button
          type="button"
          onClick={onCreateExcursion}
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105 hover:bg-emerald-500 active:scale-100"
        >
          Crear excursión
          <span className="text-lg leading-none">+</span>
        </button>
      </div>

    </header>
  )
}

export default Header