import type { MountainRoute } from '../../types/route'
import RouteCard from './RouteCard'

interface RoutesCarouselProps {
    title: string
    routes: MountainRoute[]
}

function RoutesCarousel({ title, routes }: RoutesCarouselProps) {
    return (
        <div>
            <h3 className="mb-4 text-lg font-bold text-slate-900">
                {title}
            </h3>

            <div
                className="
                    grid
                    grid-cols-1
                    justify-items-center
                    gap-4
                    sm:grid-flow-col
                    sm:grid-rows-2
                    sm:justify-center
                    sm:overflow-x-auto
                    sm:pb-2
                "
            >
                {routes.map((route) => (
                    <RouteCard key={route.id} route={route} />
                ))}
            </div>
        </div>
    )
}

export default RoutesCarousel