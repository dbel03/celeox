import L from 'leaflet'

import type { FeatureType } from '../../services/api'


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

export const peakIcon = L.divIcon({
    className: '',
    html: `
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-stone-500 shadow-lg">
            ⛰️
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
})

export const caveIcon = L.divIcon({
    className: '',
    html: `
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-700 shadow-lg">
            🕳️
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
})

export const shelterIcon = L.divIcon({
    className: '',
    html: `
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-600 shadow-lg">
            🏠
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
})

export const viewpointIcon = L.divIcon({
    className: '',
    html: `
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-500 shadow-lg">
            👁️
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
})

export const campsiteIcon = L.divIcon({
    className: '',
    html: `
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 shadow-lg">
            ⛺
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
})

export const hospitalIcon = L.divIcon({
    className: '',
    html: `
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-lg">
            🏥
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


/*
 * Icono según el tipo de feature.
 * Usado por MapView para pintar cada marcador con su icono correcto.
 */
export const iconByType: Record<FeatureType, L.DivIcon> = {
    spring: springIcon,
    peak: peakIcon,
    cave: caveIcon,
    shelter: shelterIcon,
    viewpoint: viewpointIcon,
    campsite: campsiteIcon,
    hospital: hospitalIcon,
}


/*
 * Emoji por tipo, para usar en textos/popups
 * sin repetir el HTML del icono.
 */
export const emojiByType: Record<FeatureType, string> = {
    spring: '💧',
    peak: '⛰️',
    cave: '🕳️',
    shelter: '🏠',
    viewpoint: '👁️',
    campsite: '⛺',
    hospital: '🏥',
}