import {
  MapContainer,
  Marker,
  TileLayer,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import { userLocationIcon } from './icons'

import useUserLocation from '../../hooks/useUserLocation'


interface MapPreviewProps {
  onClick?: () => void
}


function MapPreview({
  onClick,
}: MapPreviewProps) {

  /*
   * Centro inicial de Catalunya.
   *
   * Se usa mientras no tenemos la ubicación real,
   * o si el usuario no da permiso.
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
   *
   * Solo una lectura puntual (watch: false),
   * ya que es un preview y no necesita tiempo real.
   */
  const { location: userLocation } =
    useUserLocation({ watch: false })


  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block h-full w-full cursor-pointer overflow-hidden text-left"
    >

      <MapContainer
        center={userLocation ?? center}
        zoom={userLocation ? 11 : 8}
        minZoom={7}
        maxZoom={13}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        maxBounds={catalunyaBounds}
        maxBoundsViscosity={1}
        className="h-full w-full"
      >

        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker
            position={userLocation}
            icon={userLocationIcon}
          />
        )}

      </MapContainer>


      {/* Overlay */}
      <div className="absolute inset-0 z-[500] bg-black/0 transition duration-300 group-hover:bg-black/10" />


      {/* Botón visual */}
      <div className="absolute bottom-5 left-1/2 z-[600] -translate-x-1/2">

        <div className="flex items-center gap-2 rounded-full bg-slate-950/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm transition duration-300 group-hover:scale-105 group-hover:bg-emerald-600">

          <span>
            Explorar mapa
          </span>

          <span className="text-lg">
            →
          </span>

        </div>

      </div>

    </button>
  )
}


export default MapPreview