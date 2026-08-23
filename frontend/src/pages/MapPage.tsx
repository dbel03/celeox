import AppNavbar from '../navigation/AppNavbar'
import MapView from '../components/map/MapView'


function MapPage() {

    return (
        <main className="relative h-dvh w-full overflow-hidden">

            <AppNavbar floating />

            <div className="h-full w-full">
                <MapView />
            </div>

        </main>
    )
}


export default MapPage