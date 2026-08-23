import { useNavigate } from 'react-router-dom'

import Header from './Header'
import Footer from './Footer'

import ExploreSection from '../components/home-sections/ExploreSection'


function Home() {

  const navigate = useNavigate()


  return (
    <main className="flex min-h-screen flex-col bg-slate-50">

      <Header />

      <div className="flex-1">
        <ExploreSection
          onOpenMap={() => navigate('/map')}
        />
      </div>

      <Footer />

    </main>
  )
}


export default Home