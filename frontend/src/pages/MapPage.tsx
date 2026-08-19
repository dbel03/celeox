import AppNavbar from '../components/navigation/AppNavbar'
import MapView from '../components/map/MapView'


function MapPage() {

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden">

      <AppNavbar />

      <div className="min-h-0 flex-1">
        <MapView />
      </div>

    </main>
  )
}


export default MapPage