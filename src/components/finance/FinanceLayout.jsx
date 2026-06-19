import { Outlet } from 'react-router-dom'
import FinanceNav from './FinanceNav'
import DecorativeCircles from './DecorativeCircles'

export default function FinanceLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <DecorativeCircles />
      <FinanceNav />
      <main style={{
        position: 'relative',
        zIndex: 1,
        padding: '28px 32px',
        maxWidth: '1440px',
        margin: '0 auto',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
