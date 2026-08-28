import type { MountainRoute } from '../../types/route'
import RoutesCarousel from './RoutesCarousel'

interface TopRoutesSectionProps {
    routes: MountainRoute[]
}

function TopRoutesSection({ routes }: TopRoutesSectionProps) {
    const topRoutes = [...routes].sort((a, b) => b.votes - a.votes)

    return <RoutesCarousel title="🔥 Rutas más votadas" routes={topRoutes} />
}

export default TopRoutesSection