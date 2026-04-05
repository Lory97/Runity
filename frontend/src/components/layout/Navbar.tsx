'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Bell, LayoutGrid, Footprints, Users, Trophy } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  return (
    <>
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 glass shadow-ambient border-b border-outline-variant">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-surface-bright flex items-center justify-center rounded">
               <span className="text-primary text-[10px] tracking-tighter">RUN</span>
            </div>
            <Link href="/" className="font-display font-bold text-2xl tracking-tighter text-primary text-glow-primary uppercase">
              Runity
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`text-xs tracking-widest uppercase font-bold transition-colors ${pathname === '/' ? 'text-primary' : 'text-on-surface hover:text-primary'}`}>
              Dashboard
            </Link>
            {isConnected && (
              <>
                <Link href="/solo" className={`text-xs tracking-widest uppercase font-bold transition-colors ${pathname === '/solo' ? 'text-primary' : 'text-on-surface hover:text-primary'}`}>
                  Solo Mode
                </Link>
                <Link href="/multiplayer" className={`text-xs tracking-widest uppercase font-bold transition-colors ${pathname === '/multiplayer' ? 'text-primary' : 'text-on-surface hover:text-primary'}`}>
                  Multiplayer
                </Link>
                <Link href="/marketplace" className={`text-xs tracking-widest uppercase font-bold transition-colors ${pathname === '/marketplace' ? 'text-primary' : 'text-on-surface hover:text-primary'}`}>
                  Rewards
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-on-surface hover:text-primary transition-colors focus:outline-none hidden md:block">
              <Bell size={20} />
            </button>
            <appkit-network-button />
            <appkit-button />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Hub - Only shown if connected */}
      {isConnected && (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-50 glass border-t border-outline-variant bg-surface-container-highest/80 backdrop-blur-3xl px-2 pb-safe pt-2">
          <div className="flex items-center justify-around h-16">
            <Link href="/" className={`flex flex-col items-center justify-center w-full h-full rounded-lg transition-all ${pathname === '/' ? 'bg-gradient-to-t from-primary/20 to-transparent border-t-2 border-primary text-primary shadow-[inset_0_20px_20px_-20px_var(--color-primary-dim)]' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <LayoutGrid size={24} className="mb-1" />
              <span className="text-[10px] font-display uppercase tracking-widest font-bold">Dashboard</span>
            </Link>
            <Link href="/solo" className={`flex flex-col items-center justify-center w-full h-full rounded-lg transition-all ${pathname === '/solo' ? 'bg-gradient-to-t from-primary/20 to-transparent border-t-2 border-primary text-primary shadow-[inset_0_20px_20px_-20px_var(--color-primary-dim)]' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Footprints size={24} className="mb-1" />
              <span className="text-[10px] font-display uppercase tracking-widest font-bold">Solo</span>
            </Link>
            <Link href="/multiplayer" className={`flex flex-col items-center justify-center w-full h-full rounded-lg transition-all ${pathname === '/multiplayer' ? 'bg-gradient-to-t from-primary/20 to-transparent border-t-2 border-primary text-primary shadow-[inset_0_20px_20px_-20px_var(--color-primary-dim)]' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Users size={24} className="mb-1" />
              <span className="text-[10px] font-display uppercase tracking-widest font-bold">Multiplayer</span>
            </Link>
            <Link href="/marketplace" className={`flex flex-col items-center justify-center w-full h-full rounded-lg transition-all ${pathname === '/marketplace' ? 'bg-gradient-to-t from-primary/20 to-transparent border-t-2 border-primary text-primary shadow-[inset_0_20px_20px_-20px_var(--color-primary-dim)]' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <Trophy size={24} className="mb-1" />
              <span className="text-[10px] font-display uppercase tracking-widest font-bold">Rewards</span>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
