import { useState } from 'react'

import ExploreNavbar from '../components/shared/AppNavbar'
import RoutesSearchBar from '../components/exploreRoutes/RouteSearchBar'
import RoutesCarousel from '../components/exploreRoutes/RoutesCarousel'
import TopRoutesSection from '../components/exploreRoutes/TopRoutesSection'
import type { MountainRoute } from '../types/route'

const MockRoutes: MountainRoute[] = [
    {
        id: '1',
        votes: 2,
        name: 'Montcau clásica',
        distanceKm: 9.2,
        elevationGain: 620,
        totalTimeMinutes: 210,
        movingTimeMinutes: 180,
        criticalSection: 'Sendero/Corriol',
        personalRecommendations: 'Llevar bastones, tramo final resbaladizo con lluvia.',
        track: [
            { latitude: 41.612, longitude: 1.9 },
            { latitude: 41.62, longitude: 1.91 },
        ],
        segments: [],
        generalDifficulty: 'Moderada',
        technique: 'Sendero marcado',
        aerialExposure: 'Baja',
        notRecommendedFor: 'Personas con vértigo en el tramo final',
        recommendedMaterial: 'Botas de montaña, bastones',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
    },
    {
        id: '2',
        votes: 10,
        name: 'Vallparadís río',
        distanceKm: 4.5,
        elevationGain: 120,
        totalTimeMinutes: 90,
        movingTimeMinutes: 75,
        criticalSection: 'Pista',
        personalRecommendations: null,
        track: [
            { latitude: 41.56, longitude: 2.01 },
            { latitude: 41.565, longitude: 2.015 },
        ],
        segments: [],
        generalDifficulty: 'Fácil',
        technique: 'Pista ancha, apta para todos los públicos',
        aerialExposure: 'Nula',
        notRecommendedFor: null,
        recommendedMaterial: 'Calzado cómodo',
        createdAt: '2026-05-02T10:00:00Z',
        updatedAt: '2026-05-02T10:00:00Z',
    },
    {
        id: '3',
        votes: 20,
        name: 'Pirineos - Refugio',
        distanceKm: 14,
        elevationGain: 980,
        totalTimeMinutes: 360,
        movingTimeMinutes: 300,
        criticalSection: 'Roca vertical aérea',
        personalRecommendations: 'Salir temprano, tramo de roca requiere pies firmes.',
        track: [
            { latitude: 42.6, longitude: 0.9 },
            { latitude: 42.62, longitude: 0.92 },
        ],
        segments: [],
        generalDifficulty: 'Muy difícil',
        technique: 'Trepada, exposición aérea en tramo final',
        aerialExposure: 'Alta',
        notRecommendedFor: 'Personas sin experiencia en trepada',
        recommendedMaterial: 'Casco, arnés opcional, calzado técnico',
        createdAt: '2026-05-03T10:00:00Z',
        updatedAt: '2026-05-03T10:00:00Z',
    },
]

function ExploreRoutesPage() {
    const [search, setSearch] = useState('')

    const filteredRoutes = MockRoutes.filter((route) =>
        route.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <main className="flex min-h-dvh flex-col bg-slate-50">

            <ExploreNavbar />

            <div className="flex-1 px-6 py-10 lg:px-12">

                <div className="mx-auto max-w-7xl space-y-10">

                    <RoutesSearchBar value={search} onChange={setSearch} />

                    <RoutesCarousel title="Todas las rutas" routes={filteredRoutes} />

                    <TopRoutesSection routes={MockRoutes} />

                </div>

            </div>

        </main>
    )
}

export default ExploreRoutesPage