import { useNavigate } from 'react-router-dom'

import Header from '../components/home/Header'
import Footer from '../components/home/Footer'
import ExploreSection from '../components/home/ExploreSection'


function Home() {

  const navigate = useNavigate()


  return (
    <main className="flex min-h-dvh flex-col bg-slate-50">

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