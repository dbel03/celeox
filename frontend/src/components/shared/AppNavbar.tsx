import { useLocation, useNavigate } from 'react-router-dom'


function ExploreNavbar() {

    const navigate = useNavigate()
    const location = useLocation()

    const isHome = location.pathname === '/'
    const isMap = location.pathname === '/map'
    const isRoutes = location.pathname === '/routes'

    const navItems = [
        { label: 'Inicio', path: '/', active: isHome },
        { label: 'Mapa', path: '/map', active: isMap },
        { label: 'Rutas', path: '/routes', active: isRoutes },
    ]

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
                border-slate-200
                bg-white/90
                px-6
                py-3
                backdrop-blur
                lg:px-12
            "
        >

            {/* =====================================================
                LOGO
            ===================================================== */}

            <button
                type="button"
                onClick={() => navigate('/')}
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


            {/* =====================================================
                NAVEGACIÓN
            ===================================================== */}

            <div
                className="
                    flex
                    items-center
                    gap-1
                    rounded-full
                    border
                    border-slate-200
                    bg-slate-50
                    p-1
                "
            >

                {navItems.map((item) => (

                    <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        aria-current={item.active ? 'page' : undefined}
                        className={`
                            rounded-full
                            px-4
                            py-2
                            text-sm
                            font-medium
                            transition

                            ${item.active
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            }
                        `}
                    >
                        {item.label}
                    </button>

                ))}

            </div>


            {/* =====================================================
                ACCIÓN (crear ruta, perfil, etc — placeholder)
            ===================================================== */}

            <button
                type="button"
                onClick={() => navigate('/crear-ruta')}
                className="
                    hidden
                    rounded-full
                    bg-emerald-600
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-emerald-500
                    sm:inline-flex
                    sm:items-center
                "
            >
                + Crear ruta
            </button>

        </nav>
    )
}


export default ExploreNavbar