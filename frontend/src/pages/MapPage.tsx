import AppNavbar from '../navigation/AppNavbar'
import MapView from '../components/map/MapView'


function MapPage() {

    return (

        <main
            className="
                fixed
                inset-0
                overflow-hidden
            "
        >

            <AppNavbar floating />

            <div
                className="
                    h-full
                    w-full
                "
            >

                <MapView />

            </div>

        </main>

    )

}


export default MapPage