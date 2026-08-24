import { useState } from 'react'
import AppNavbar from '../navigation/AppNavbar'
import MapView from '../components/map/MapView'


function MapPage() {

    const [navHidden, setNavHidden] = useState(false)

    return (
        <main
            className="
                fixed
                inset-0
                overflow-hidden
                overscroll-none
            "
        >

            <AppNavbar floating hidden={navHidden} />

            <div className="h-full w-full">
                <MapView onDetailOpenChange={setNavHidden} />
            </div>

        </main>
    )
}


export default MapPage