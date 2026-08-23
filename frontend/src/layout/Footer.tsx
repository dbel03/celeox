import { Celeox } from "../components/shared/Celeox"

function Footer() {

    return (
        <footer className="bg-slate-950 text-white">

            <div className="mx-auto max-w-6xl px-6 py-2 lg:px-8">

                <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-center sm:gap-8">

                    <Celeox/>

                    <div className="flex flex-col items-center gap-1 text-center text-xs text-slate-500 sm:flex-row sm:gap-3">
                        <p>
                            © {new Date().getFullYear()} Celeox. Todos los derechos reservados.
                        </p>

                        <span className="hidden text-slate-700 sm:inline">•</span>

                        <p className="text-slate-400">
                            Hecho con <span className="text-emerald-500">♥</span> para la comunidad excursionista
                        </p>
                    </div>
                </div>
            </div>

        </footer>
    )
}

export default Footer