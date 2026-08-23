import { Celeox } from "../components/shared/Celeox"

interface HeaderProps {
  onLogin?: () => void
}

function Header({ onLogin }: HeaderProps) {
  return (
    <header className="relative w-full h-28 overflow-hidden">

      <img
        src="/images/mountain-hero.jpg"
        alt="Fondo de montañas"
        className="absolute inset-0 w-full h-full object-cover object-[center_70%]"
      />

      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative z-10 h-full flex items-center px-4 lg:px-12">

        <img
          src="/images/logo.png"
          alt="Celeox logo"
          className="h-14 sm:h-24 w-auto"
        />

        <div className="absolute left-1/2 -translate-x-1/2 scale-200 origin-center">
          <Celeox />
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="ml-auto rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
        >
          Iniciar sesión
        </button>

      </div>
    </header>
  )
}

export default Header