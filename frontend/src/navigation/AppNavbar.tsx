import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


interface AppNavbarProps {
    floating?: boolean
}


function AppNavbar({
    floating = false,
}: AppNavbarProps) {

    const navigate = useNavigate()
    const location = useLocation()

    const isHome = location.pathname === '/'
    const isMap = location.pathname === '/map'

    const [menuOpen, setMenuOpen] = useState(false)
    const [navItemsOpen, setNavItemsOpen] = useState(true)


    return (
        <nav
            className={`
                left-0 right-0 top-0 z-[2000] pointer-events-none
                bg-transparent text-white
                ${floating ? 'absolute' : 'relative'}
            `}
        >

            <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="Ir al inicio"
                className="pointer-events-auto absolute right-4 top-3 z-10"
            >
                <img
                    src="/images/logo.png"
                    alt="Celeox logo"
                    className="h-14 w-14 drop-shadow-lg"
                />
            </button>

            <div className="pointer-events-auto fixed right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-2 sm:flex">

                <button
                    type="button"
                    onClick={() => setNavItemsOpen((open) => !open)}
                    aria-label={navItemsOpen ? 'Ocultar accesos' : 'Mostrar accesos'}
                    aria-expanded={navItemsOpen}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black bg-black text-white shadow-sm transition hover:bg-neutral-800"
                >

                    <svg
                        className={`h-4 w-4 transition-transform duration-300 ${navItemsOpen ? 'rotate-45' : 'rotate-0'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16M4 12h16"
                        />
                    </svg>

                </button>

                <div className="flex flex-col items-center gap-2">

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        aria-label="Inicio"
                        aria-current={isHome ? 'page' : undefined}
                        style={{ transitionDelay: navItemsOpen ? '60ms' : '0ms' }}
                        className={`
                            relative flex h-11 w-11 origin-top items-center justify-center rounded-full border bg-emerald-600 text-white shadow-sm transition-all duration-300 ease-in-out hover:border-emerald-300 hover:bg-emerald-500
                            ${isHome ? 'border-black ring-2 ring-black/70' : 'border-emerald-400/50'}
                            ${navItemsOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-14 scale-0 opacity-0'}
                        `}
                    >
                        {isHome && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-black" />
                        )}
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/map')}
                        aria-label="Mapa"
                        aria-current={isMap ? 'page' : undefined}
                        style={{ transitionDelay: navItemsOpen ? '120ms' : '0ms' }}
                        className={`
                            relative flex h-11 w-11 origin-top items-center justify-center rounded-full border bg-emerald-600 text-white shadow-sm transition-all duration-300 ease-in-out hover:border-emerald-300 hover:bg-emerald-500
                            ${isMap ? 'border-black ring-2 ring-black/70' : 'border-emerald-400/50'}
                            ${navItemsOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-28 scale-0 opacity-0'}
                        `}
                    >
                        {isMap && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-black" />
                        )}
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                        </svg>
                    </button>

                </div>

            </div>

            <div className="pointer-events-auto mx-auto flex h-16 max-w-7xl items-center justify-end px-6">

                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label="Abrir menú"
                    aria-expanded={menuOpen}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-500 sm:hidden"
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

            {menuOpen && (

                <div className="pointer-events-auto flex flex-col gap-2 px-6 py-4 sm:hidden">

                    <button
                        type="button"
                        onClick={() => {
                            navigate('/')
                            setMenuOpen(false)
                        }}
                        aria-current={isHome ? 'page' : undefined}
                        className={`
                            rounded-lg border bg-emerald-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-sm transition hover:border-emerald-300 hover:bg-emerald-500
                            ${isHome ? 'border-black ring-2 ring-black/70' : 'border-emerald-400/50'}
                        `}
                    >
                        Inicio
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            navigate('/mapa')
                            setMenuOpen(false)
                        }}
                        aria-current={isMap ? 'page' : undefined}
                        className={`
                            rounded-lg border bg-emerald-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-sm transition hover:border-emerald-300 hover:bg-emerald-500
                            ${isMap ? 'border-black ring-2 ring-black/70' : 'border-emerald-400/50'}
                        `}
                    >
                        Mapa
                    </button>

                </div>

            )}

        </nav>
    )
}

export default AppNavbar