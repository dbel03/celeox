import {
  useEffect,
} from 'react'

import {
  useMap,
} from 'react-leaflet'

import type {
  MountainFeature,
} from '../../services/api'


interface SearchControllerProps {
  feature: MountainFeature | null
}


function SearchController({
  feature,
}: SearchControllerProps) {

  const map = useMap()


  useEffect(() => {

    if (!feature) {
      return
    }

    map.flyTo(
      [
        feature.latitude,
        feature.longitude,
      ],
      17,
      {
        duration: 1.5,
      }
    )

  }, [
    feature,
    map,
  ])


  return null
}


export default SearchController