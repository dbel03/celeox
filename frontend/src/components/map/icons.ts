import L from 'leaflet'

export const springIcon = L.divIcon({
    className: '',
    html: `
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-lg">
            💧
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
})