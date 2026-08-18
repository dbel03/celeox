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

export const userLocationIcon = L.divIcon({
    className: '',
    html: `
        <div class="user-location-marker">
            <div class="user-location-dot"></div>
        </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
})