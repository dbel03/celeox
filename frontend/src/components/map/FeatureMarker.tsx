import {
  memo,
} from 'react'

import {
  Marker,
} from 'react-leaflet'

import type {
  MountainFeature,
} from '../../services/api'

import {
  iconByType,
  smallIconByType,
  userLocationIcon,
  selectedFeatureIcon,
} from './icons'


interface FeatureMarkerProps {
  feature: MountainFeature
  selected: boolean
  isDetailOpen: boolean
  onOpenDetail: (
    feature: MountainFeature
  ) => void
}


const FeatureMarker = memo(
  function FeatureMarker({
    feature,
    selected,
    isDetailOpen,
    onOpenDetail,
  }: FeatureMarkerProps) {


    const icon =
      selected
        ? selectedFeatureIcon
        : isDetailOpen
          ? iconByType[
              feature.type as keyof typeof iconByType
            ] ?? userLocationIcon
          : smallIconByType[
              feature.type as keyof typeof smallIconByType
            ] ?? userLocationIcon


    return (
      <Marker
        position={[
          feature.latitude,
          feature.longitude,
        ]}
        icon={icon}
        eventHandlers={{
          click: () => onOpenDetail(feature),
        }}
      />
    )

  }
)


export default FeatureMarker