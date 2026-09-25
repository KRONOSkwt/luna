import type { ReactNode } from 'react'
import { BovedaPage } from './features/boveda/BovedaPage'

// W2 override: hand-rolled route switch (no react-router in this slice).
// The public dome owns '/'; ANY other path falls back to it — zero dead UI,
// no white screen on a stray URL (design D11 without a router).
const sectorRoutes: Record<string, ReactNode> = {
  '/': <BovedaPage />,
}

function App() {
  const path = window.location.pathname
  return sectorRoutes[path] ?? <BovedaPage />
}

export default App