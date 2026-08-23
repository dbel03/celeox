import { Celeox } from "../components/shared/Celeox"

interface HeaderProps {
  onLogin?: () => void
}

function Header({
  onLogin,
}: HeaderProps) {

  return (
    <header className="relative overflow-hidden">

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/mountain-hero.jpg')",
        }}
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative z-10 flex items-center justify-between px-4 py-3 lg:px-12">
        <button type="button" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Celeox />
        </button>
        <img
          src="/images/logo.png"
          alt="Celeox logo"
          className="h-30 w-30"
        />
        <button
          type="button"
          onClick={onLogin}
          className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
        >
          Iniciar sesión
        </button>
      </div>
    </header>
  )
}

export default Header