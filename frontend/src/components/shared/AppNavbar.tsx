import { useNavigate } from 'react-router-dom'


function ExploreNavbar() {

    const navigate = useNavigate()

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
                    p-1
                "
            >
                <button
                    type="button"
                    onClick={() => navigate('/')}
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
                    Inicio
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/map')}
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
                    Mapa
                </button>



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
            </div>
        </nav>
    )
}


export default ExploreNavbar