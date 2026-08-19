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

export const selectedFeatureIcon = L.divIcon({
    className: '',
    html: `
        <div style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #ef4444;
            border: 3px solid white;
            box-shadow: 0 0 0 4px rgba(239,68,68,0.35), 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        ">
            📍
        </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
})

/*
 * Versión pequeña de cada icono, para el estado "normal"
 * (sin clicar). Discretos, pegados al mapa, sin apenas sombra.
 */
export const springIconSmall = L.divIcon({
    className: '',
    html: `
        <div class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-blue-500 text-[10px] shadow-sm">
            💧
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
})

export const peakIconSmall = L.divIcon({
    className: '',
    html: `
        <div class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-stone-500 text-[10px] shadow-sm">
            ⛰️
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
})

export const caveIconSmall = L.divIcon({
    className: '',
    html: `
        <div class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-slate-700 text-[10px] shadow-sm">
            🕳️
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
})

export const shelterIconSmall = L.divIcon({
    className: '',
    html: `
        <div class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-amber-600 text-[10px] shadow-sm">
            🏠
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
})

export const viewpointIconSmall = L.divIcon({
    className: '',
    html: `
        <div class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-purple-500 text-[10px] shadow-sm">
            👁️
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
})

export const campsiteIconSmall = L.divIcon({
    className: '',
    html: `
        <div class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-emerald-600 text-[10px] shadow-sm">
            ⛺
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
})

export const hospitalIconSmall = L.divIcon({
    className: '',
    html: `
        <div class="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white bg-red-500 text-[10px] shadow-sm">
            🏥
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
})


/*
 * Icono pequeño según el tipo, para el estado normal (sin clicar).
 */
export const smallIconByType: Record<FeatureType, L.DivIcon> = {
    spring: springIconSmall,
    peak: peakIconSmall,
    cave: caveIconSmall,
    shelter: shelterIconSmall,
    viewpoint: viewpointIconSmall,
    campsite: campsiteIconSmall,
    hospital: hospitalIconSmall,
}