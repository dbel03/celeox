import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

function AppNavbar() {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    const go = (path: string) => {
        setOpen(false)
        navigate(path)
    }

    return (
        <nav
            className="
                sticky
                top-0
                z-[2000]
                flex
                items-center
                justify-between
                border-b
                border-white/60
                bg-white/70
                px-6
                py-3
                shadow-[0_4px_20px_rgba(148,163,184,0.15)]
                backdrop-blur-lg
                lg:px-12
            "
        >

            {/* LOGO */}
            <button
                type="button"
                onClick={() => go('/')}
                aria-label="Ir al inicio"
                title="Inicio"
                className="flex items-center gap-2"
            >
                <img
                    src="/images/logo.png"
                    alt="Celeox logo"
                    className="h-9 w-9 object-contain"
                />
                <span className="hidden text-sm font-bold text-slate-900 sm:inline">
                    Celeox
                </span>
            </button>

            {/* NAV DESKTOP */}
            <div className="hidden items-center gap-1 rounded-full border border-white/60 bg-white/50 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-lg sm:flex">
                <button type="button" onClick={() => go('/')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                    Inicio
                </button>
                <button type="button" onClick={() => go('/map')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                    Mapa
                </button>
                <button type="button" onClick={() => go('/crear-ruta')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                    Crear ruta
                </button>
            </div>

            {/* TOGGLE MÓVIL */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={open}
                className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/50 p-2 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-lg transition hover:bg-white/80 sm:hidden"
            >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* MENÚ MÓVIL DESPLEGABLE */}
            {open && (
                <div
                    className="
                        absolute
                        left-0
                        right-0
                        top-full
                        mx-4
                        mt-2
                        flex
                        flex-col
                        gap-2
                        rounded-2xl
                        border
                        border-white/60
                        bg-white/70
                        p-3
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_24px_rgba(148,163,184,0.2)]
                        backdrop-blur-lg
                        sm:hidden
                    "
                >
                    <button type="button" onClick={() => go('/')} className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                        Inicio
                    </button>
                    <button type="button" onClick={() => go('/map')} className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                        Mapa
                    </button>
                    <button type="button" onClick={() => go('/crear-ruta')} className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                        Crear ruta
                    </button>
                </div>
            )}
        </nav>
    )
}

export default AppNavbar