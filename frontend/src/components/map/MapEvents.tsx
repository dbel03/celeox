import {
  useEffect,
} from 'react'

import {
  useMap,
} from 'react-leaflet'


export interface MapBounds {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}


interface MapEventsProps {
  onBoundsChange: (
    bounds: MapBounds,
    zoom: number
  ) => void
}


function MapEvents({
  onBoundsChange,
}: MapEventsProps) {

  const map = useMap()

  useEffect(() => {

    let timeoutId: number | undefined


    const handleMoveEnd = () => {

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }


      timeoutId = window.setTimeout(() => {

        const bounds = map.getBounds()


        onBoundsChange(
          {
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
            minLon: bounds.getWest(),
            maxLon: bounds.getEast(),
          },
          map.getZoom()
        )

      }, 250)

    }


    map.on(
      'moveend',
      handleMoveEnd
    )


    /*
     * Carga inicial
     */
    const initialBounds = map.getBounds()


    onBoundsChange(
      {
        minLat: initialBounds.getSouth(),
        maxLat: initialBounds.getNorth(),
        minLon: initialBounds.getWest(),
        maxLon: initialBounds.getEast(),
      },
      map.getZoom()
    )


    return () => {

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }


      map.off(
        'moveend',
        handleMoveEnd
      )

    }

  }, [
    map,
    onBoundsChange,
  ])


  return null
}


export default MapEvents