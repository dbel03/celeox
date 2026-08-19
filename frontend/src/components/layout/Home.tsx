import { useNavigate } from 'react-router-dom'

import Header from './Header'
import Footer from './Footer'

import ExploreSection from '../home-sections/ExploreSection'
import StatsSection from '../home-sections/StatsSection'


function Home() {

  const navigate = useNavigate()


  return (
    <main className="min-h-screen bg-slate-50">

      <Header />

      <ExploreSection
        onOpenMap={() => navigate('/map')}
      />

      <StatsSection />

      <Footer />

    </main>
  )
}


export default Home