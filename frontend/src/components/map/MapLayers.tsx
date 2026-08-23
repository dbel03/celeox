import {
  LayersControl,
  TileLayer,
} from 'react-leaflet'


const {
  BaseLayer,
} = LayersControl


function MapLayers() {

  return (
    <LayersControl
      position="topright"
    >

      {/* =========================================
          OPENSTREETMAP
      ========================================= */}

      <BaseLayer
        checked
        name="OpenStreetMap"
      >

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

      </BaseLayer>


      {/* =========================================
          IGN BASE
      ========================================= */}

      <BaseLayer
        name="IGN"
      >

        <TileLayer
          attribution='&copy; Instituto Geográfico Nacional'
          url="https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg"
          maxZoom={19}
        />

      </BaseLayer>


      {/* =========================================
          ORTOFOTO PNOA
      ========================================= */}

      <BaseLayer
        name="IGN · Ortofoto PNOA"
      >

        <TileLayer
          attribution='&copy; Instituto Geográfico Nacional'
          url="https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg"
          maxZoom={19}
        />

      </BaseLayer>

    </LayersControl>
  )
}


export default MapLayers