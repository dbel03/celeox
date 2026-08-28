import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import { userLocationIcon } from '../map/icons'

import useUserLocation from '../../hooks/useUserLocation'


interface MapPreviewProps {
  onClick?: () => void
}


function MapPreview({
  onClick,
}: MapPreviewProps) {

  /*
   * Centro inicial de Catalunya.
   */
  const center: [number, number] = [
    41.65,
    1.75,
  ]


  const catalunyaBounds: [
    [number, number],
    [number, number]
  ] = [
    [40.5, 0.15],
    [42.9, 3.35],
  ]


  /*
   * Ubicación del usuario.
   */
  const { location: userLocation } =
    useUserLocation({ watch: false })


  return (
    <div className="group relative block h-full w-full overflow-hidden">

      <MapContainer
        center={userLocation ?? center}
        zoom={userLocation ? 11 : 8}

        minZoom={7}
        maxZoom={13}

        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        zoomControl={false}

        attributionControl={false}

        maxBounds={catalunyaBounds}
        maxBoundsViscosity={1}

        className="h-full w-full"
      >

        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* Controles de zoom */}
        <ZoomControl position="topright" />


        {/* Ubicación del usuario */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={userLocationIcon}
          />
        )}

      </MapContainer>


      {/* Overlay */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-[500]
          bg-black/0
          transition
          duration-300
          group-hover:bg-black/10
        "
      />


      {/* Botón explorar */}
      <button
        type="button"
        onClick={onClick}
        className="
          absolute
          bottom-5
          left-1/2
          z-[600]
          -translate-x-1/2

          flex
          items-center
          gap-2

          rounded-full
          bg-slate-950/90
          px-5
          py-3

          text-sm
          font-semibold
          text-white

          shadow-xl
          backdrop-blur-sm

          transition
          duration-300

          hover:scale-105
          hover:bg-emerald-600
        "
      >

        <span>
          Explorar mapa
        </span>

        <span className="text-lg">
          →
        </span>

      </button>

    </div>
  )
}


export default MapPreview