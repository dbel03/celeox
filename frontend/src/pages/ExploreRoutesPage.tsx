import { useEffect, useState } from 'react'

import AppNavbar from '../components/shared/AppNavbar'
import RoutesSearchBar from '../components/exploreRoutes/RouteSearchBar'
import RoutesCarousel from '../components/exploreRoutes/RoutesCarousel'
import TopRoutesSection from '../components/exploreRoutes/TopRoutesSection'
import { getRoutes } from '../services/api'
import type { MountainRoute } from '../types/route'

function ExploreRoutesPage() {
    const [search, setSearch] = useState('')
    const [routes, setRoutes] = useState<MountainRoute[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        const fetchRoutes = async () => {
            setLoading(true)
            setError(null)

            try {
                const data = await getRoutes()
                if (!cancelled) setRoutes(data)
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Error desconocido')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchRoutes()

        return () => {
            cancelled = true
        }
    }, [])

    const filteredRoutes = routes.filter((route) =>
        route.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <main className="flex min-h-dvh flex-col bg-slate-50">

            <AppNavbar />

            <div className="flex-1 px-6 py-10 lg:px-12">

                <div className="mx-auto max-w-7xl space-y-10">

                    <RoutesSearchBar value={search} onChange={setSearch} />

                    {error && (
                        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                            No se han podido cargar las rutas: {error}
                        </p>
                    )}

                    {loading ? (
                        <p className="text-sm text-slate-500">Cargando rutas...</p>
                    ) : (
                        <>
                            <div className="mx-auto w-full max-w-6xl">
                                <RoutesCarousel
                                    title="Todas las rutas"
                                    routes={filteredRoutes.slice(0, 10)}
                                />

                                <TopRoutesSection routes={routes} />
                            </div>

                        </>
                    )}

                </div>

            </div>

        </main>
    )
}

export default ExploreRoutesPage