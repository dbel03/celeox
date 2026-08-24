import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


interface AppNavbarProps {
    floating?: boolean
    hidden?: boolean
}


function AppNavbar({
    floating = false,
    hidden =false 
}: AppNavbarProps) {

    const navigate = useNavigate()
    const location = useLocation()

    const isHome = location.pathname === '/'
    const isMap = location.pathname === '/map'

    const [navItemsOpen, setNavItemsOpen] = useState(true)


    return (
        <nav
            className={`
                left-0
                right-0
                top-0
                z-[2000]
                pointer-events-none
                bg-transparent
                text-white
                transition-opacity
                duration-200
                ${floating ? 'absolute' : 'relative'}
                ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
        >

            {/* =====================================================
                LOGO
            ===================================================== */}

            <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="Ir al inicio"
                className="
                    pointer-events-auto
                    absolute
                    right-4
                    top-3
                    z-[2010]
                    rounded-full
                "
            >

                <img
                    src="/images/logo.png"
                    alt="Celeox logo"
                    className="
                        h-14
                        w-14
                        object-contain
                        drop-shadow-lg
                    "
                />

            </button>


            {/* =====================================================
                NAVEGACIÓN
            ===================================================== */}

            <div
                className="
                    pointer-events-auto
                    fixed
                    right-4
                    top-1/2
                    z-[2010]
                    flex
                    -translate-y-1/2
                    flex-col
                    items-center
                    gap-2
                "
            >

                {/* =================================================
                    BOTÓN DESPLEGAR
                ================================================= */}

                <button
                    type="button"
                    onClick={() =>
                        setNavItemsOpen((open) => !open)
                    }
                    aria-label={
                        navItemsOpen
                            ? 'Ocultar accesos'
                            : 'Mostrar accesos'
                    }
                    aria-expanded={navItemsOpen}
                    className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-black
                        bg-black
                        text-white
                        shadow-lg
                        transition
                        hover:bg-neutral-800
                    "
                >

                    <svg
                        className={`
                            h-4
                            w-4
                            transition-transform
                            duration-300
                            ${
                                navItemsOpen
                                    ? 'rotate-45'
                                    : 'rotate-0'
                            }
                        `}
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


                {/* =================================================
                    ACCESOS
                ================================================= */}

                <div
                    className="
                        flex
                        flex-col
                        items-center
                        gap-2
                    "
                >

                    {/* =================================================
                        INICIO
                    ================================================= */}

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        aria-label="Inicio"
                        aria-current={
                            isHome
                                ? 'page'
                                : undefined
                        }
                        style={{
                            transitionDelay:
                                navItemsOpen
                                    ? '60ms'
                                    : '0ms',
                        }}
                        className={`
                            relative
                            flex
                            h-11
                            w-11
                            origin-top
                            items-center
                            justify-center
                            rounded-full
                            border
                            bg-emerald-600
                            text-white
                            shadow-lg
                            transition-all
                            duration-300
                            ease-in-out
                            hover:border-emerald-300
                            hover:bg-emerald-500

                            ${
                                isHome
                                    ? 'border-black ring-2 ring-black/70'
                                    : 'border-emerald-400/50'
                            }

                            ${
                                navItemsOpen
                                    ? 'translate-y-0 scale-100 opacity-100'
                                    : 'pointer-events-none -translate-y-14 scale-0 opacity-0'
                            }
                        `}
                    >

                        {isHome && (

                            <span
                                className="
                                    absolute
                                    -right-0.5
                                    -top-0.5
                                    h-2.5
                                    w-2.5
                                    rounded-full
                                    border-2
                                    border-white
                                    bg-black
                                "
                            />

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
                                d="
                                    M3 12l2-2
                                    m0 0l7-7
                                    7 7
                                    M5 10v10
                                    a1 1 0 001 1h3
                                    m10-11l2 2
                                    m-2-2v10
                                    a1 1 0 01-1 1h-3
                                    m-6 0a1 1 0 001-1v-4
                                    a1 1 0 011-1h2
                                    a1 1 0 011 1v4
                                    a1 1 0 001 1
                                    m-6 0h6
                                "
                            />

                        </svg>

                    </button>


                    {/* =================================================
                        MAPA
                    ================================================= */}

                    <button
                        type="button"
                        onClick={() => navigate('/map')}
                        aria-label="Mapa"
                        aria-current={
                            isMap
                                ? 'page'
                                : undefined
                        }
                        style={{
                            transitionDelay:
                                navItemsOpen
                                    ? '120ms'
                                    : '0ms',
                        }}
                        className={`
                            relative
                            flex
                            h-11
                            w-11
                            origin-top
                            items-center
                            justify-center
                            rounded-full
                            border
                            bg-emerald-600
                            text-white
                            shadow-lg
                            transition-all
                            duration-300
                            ease-in-out
                            hover:border-emerald-300
                            hover:bg-emerald-500

                            ${
                                isMap
                                    ? 'border-black ring-2 ring-black/70'
                                    : 'border-emerald-400/50'
                            }

                            ${
                                navItemsOpen
                                    ? 'translate-y-0 scale-100 opacity-100'
                                    : 'pointer-events-none -translate-y-28 scale-0 opacity-0'
                            }
                        `}
                    >

                        {isMap && (

                            <span
                                className="
                                    absolute
                                    -right-0.5
                                    -top-0.5
                                    h-2.5
                                    w-2.5
                                    rounded-full
                                    border-2
                                    border-white
                                    bg-black
                                "
                            />

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
                                d="
                                    M9 20l-5.447-2.724
                                    A1 1 0 013 16.382V5.618
                                    A1 1 0 014.447 4.724L9 7
                                    m0 13l6-3
                                    m-6 3V7
                                    m6 10l4.553 2.276
                                    A1 1 0 0021 18.382V7.618
                                    a1 1 0 00-.553-.894L15 4
                                    m0 13V4
                                    m0 0L9 7
                                "
                            />

                        </svg>

                    </button>

                </div>

            </div>

        </nav>
    )
}


export default AppNavbar