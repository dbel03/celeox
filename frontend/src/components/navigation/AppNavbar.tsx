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


                {/* Navegación */}

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
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                        Mapa
                    </button>

                </div>

            </div>

        </nav>
    )
}


export default AppNavbar