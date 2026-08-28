import { useNavigate } from 'react-router-dom'

import Header from '../components/home/Header'
import Footer from '../components/home/Footer'
import ExploreRoutesSection from '../components/home/ExploreRoutesSection'
import MapSection from '../components/home/MapSection'
import GroupsSection from '../components/home/GroupsSection'


function Home() {

  const navigate = useNavigate()


  return (
    <main className="flex min-h-dvh flex-col bg-slate-50">

      <Header />

      <div className="flex-1">

        <section className="bg-slate-50 px-6 py-20 lg:px-12">

          <div className="mx-auto max-w-7xl">

            <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)_minmax(280px,1fr)]">

              <ExploreRoutesSection />

              <MapSection onOpenMap={() => navigate('/map')} />

              <GroupsSection />

            </div>

          </div>

        </section>

      </div>

      <Footer />

    </main>
  )
}


export default Home