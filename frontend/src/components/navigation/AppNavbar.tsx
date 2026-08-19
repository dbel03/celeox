import { useState } from 'react'
import { useNavigate } from 'react-router-dom'


interface AppNavbarProps {
    /*
     * Si es true, el navbar flota (absolute) sobre el contenido,
     * pensado para páginas con un hero de fondo (ej. la home).
     *
     * Si es false (por defecto), el navbar ocupa su propio espacio
     * en el layout (relative), empujando el contenido de abajo.
     * Pensado para páginas como el mapa, donde no debe solaparse.
     */
    floating?: boolean
}


function AppNavbar({
    floating = false,
}: AppNavbarProps) {

    const navigate = useNavigate()

    const [menuOpen, setMenuOpen] = useState(false)


    return (
        <nav
            className={`
                left-0 right-0 top-0 z-[2000]
                border-b border-white/10 bg-slate-950/90 text-white backdrop-blur-md
                ${floating ? 'absolute' : 'relative'}
            `}
        >

            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                {/* Logo */}

                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-xl font-bold tracking-tight"
                >

                    <img
                        src="/images/logo.png"
                        alt="Celeox logo"
                        className="h-8 w-8"
                    />

                    <span>
                        <span className="text-emerald-500">
                            CELE
                        </span>

                        <span className="text-white">
                            OX
                        </span>
                    </span>

                </button>


                {/* Navegación escritorio */}

                <div className="hidden items-center gap-2 sm:flex">

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        Inicio
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/map')}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                        Mapa
                    </button>

                </div>


                {/* Botón hamburguesa (solo móvil) */}

                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label="Abrir menú"
                    aria-expanded={menuOpen}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10 sm:hidden"
                >

                    <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {menuOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>

                </button>

            </div>


            {/* Menú desplegable (solo móvil) */}

            {menuOpen && (

                <div className="flex flex-col gap-1 border-t border-white/10 px-6 py-4 sm:hidden">

                    <button
                        type="button"
                        onClick={() => {
                            navigate('/')
                            setMenuOpen(false)
                        }}
                        className="rounded-lg px-4 py-3 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        Inicio
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            navigate('/mapa')
                            setMenuOpen(false)
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                        Mapa
                    </button>

                </div>

            )}

        </nav>
    )
}


export default AppNavbar