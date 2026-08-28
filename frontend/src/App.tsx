import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import Home from './pages/HomePage'
import MapPage from './pages/MapPage'
import CreateRoutePage from './pages/CreateRoutePage'


function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/map"
          element={<MapPage />}
        />

        <Route
          path="/crear-ruta"
          element={<CreateRoutePage />}
        />

      </Routes>

    </BrowserRouter>
  )
}


export default App