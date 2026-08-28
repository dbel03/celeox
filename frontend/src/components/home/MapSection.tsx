import MapPreview from '../home/MapPreview'

interface MapSectionProps {
    onOpenMap?: () => void
}

function MapSection({ onOpenMap }: MapSectionProps) {
    return (
        <div className="relative h-[500px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <MapPreview onClick={onOpenMap} />
        </div>
    )
}

export default MapSection