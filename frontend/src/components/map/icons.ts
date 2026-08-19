import L from 'leaflet'

import type { FeatureType } from '../../services/api'


/* =========================================================
   RUTAS DE LAS IMÁGENES
========================================================= */

export const iconPaths: Record<FeatureType, string> = {
    spring: '/images/icons/spring.png',
    peak: '/images/icons/peak.png',
    cave: '/images/icons/cave.png',
    shelter: '/images/icons/shelter.png',
    viewpoint: '/images/icons/viewpoint.png',
    campsite: '/images/icons/campsite.png',
    hospital: '/images/icons/hospital.png',
}


/* =========================================================
   HELPERS PARA CREAR LOS DIVICON
========================================================= */

/*
 * Icono normal (32px).
 */
function createIcon(imagePath: string) {

    return L.divIcon({
        className: '',
        html: `
            <img
                src="${imagePath}"
                style="
                    width: 32px;
                    height: 32px;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
                    display: block;
                "
            />
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    })

}


/*
 * Icono pequeño (18px)
 */
function createSmallIcon(imagePath: string) {

    return L.divIcon({
        className: '',
        html: `
            <img
                src="${imagePath}"
                style="
                    width: 18px;
                    height: 18px;
                    object-fit: contain;
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));
                    display: block;
                "
            />
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -9],
    })

}


/* =========================================================
   ICONOS INDIVIDUALES (tamaño normal)
========================================================= */

export const springIcon = createIcon(iconPaths.spring)
export const peakIcon = createIcon(iconPaths.peak)
export const caveIcon = createIcon(iconPaths.cave)
export const shelterIcon = createIcon(iconPaths.shelter)
export const viewpointIcon = createIcon(iconPaths.viewpoint)
export const campsiteIcon = createIcon(iconPaths.campsite)
export const hospitalIcon = createIcon(iconPaths.hospital)


/* =========================================================
   ICONOS INDIVIDUALES (tamaño pequeño)
========================================================= */

export const springIconSmall = createSmallIcon(iconPaths.spring)
export const peakIconSmall = createSmallIcon(iconPaths.peak)
export const caveIconSmall = createSmallIcon(iconPaths.cave)
export const shelterIconSmall = createSmallIcon(iconPaths.shelter)
export const viewpointIconSmall = createSmallIcon(iconPaths.viewpoint)
export const campsiteIconSmall = createSmallIcon(iconPaths.campsite)
export const hospitalIconSmall = createSmallIcon(iconPaths.hospital)


/* =========================================================
   UBICACIÓN DEL USUARIO (sin cambios)
========================================================= */

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


/* =========================================================
   MAPAS type -> icono
========================================================= */

export const iconByType: Record<FeatureType, L.DivIcon> = {
    spring: springIcon,
    peak: peakIcon,
    cave: caveIcon,
    shelter: shelterIcon,
    viewpoint: viewpointIcon,
    campsite: campsiteIcon,
    hospital: hospitalIcon,
}

export const smallIconByType: Record<FeatureType, L.DivIcon> = {
    spring: springIconSmall,
    peak: peakIconSmall,
    cave: caveIconSmall,
    shelter: shelterIconSmall,
    viewpoint: viewpointIconSmall,
    campsite: campsiteIconSmall,
    hospital: hospitalIconSmall,
}

/* =========================================================
   SELECCIONADO (buscador)
========================================================= */

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