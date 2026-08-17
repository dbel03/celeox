import { useEffect, useState } from 'react'
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import { getMap } from '../../services/api'

interface MapData {
    latitude: number
    longitude: number
    zoom: number
}

function MapView() {
    const [mapData, setMapData] = useState<MapData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getMap()
            .then((data) => {
                setMapData(data)
            })
            .catch((error) => {
                console.error(error)
                setError('No se ha podido conectar con el servidor')
            })
    }, [])

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <p className="text-red-500">
                    {error}
                </p>
            </div>
        )
    }

    if (!mapData) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <p>
                    Cargando mapa...
                </p>
            </div>
        )
    }

    const center: [number, number] = [
        mapData.latitude,
        mapData.longitude,
    ]

    return (
        <MapContainer
            center={center}
            zoom={mapData.zoom}
            scrollWheelZoom={true}
            className="h-full w-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={center}>
                <Popup>
                    <strong>Ubicación recibida desde C#</strong>
                    <br />
                    Latitud: {mapData.latitude}
                    <br />
                    Longitud: {mapData.longitude}
                </Popup>
            </Marker>
        </MapContainer>
    )
}

export default MapView