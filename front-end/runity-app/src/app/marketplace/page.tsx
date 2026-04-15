'use client'

import React, { useState } from 'react'
import { parseEther, formatEther } from 'viem'
import { 
  ShoppingBag, Zap, CircleDashed, Lock, ArrowRight, Medal, ShieldAlert, Plus 
} from 'lucide-react'
import { 
  useIsOwner, 
  useAddPromoCode, 
  useFetchPromoCodes, 
  useRedeemPromoCode 
} from '@/hooks/useRunCore'

// --- MOCKED DATA STRINGS (Static UI mapping to on-chain IDs) ---
const HERO_REWARD = {
  id: 0, // Assume promoId 0 is for the Alphafly
  brand: "Nike",
  title: "-25% Alphafly Next%",
  description: "Valid for the next 48 hours only.",
  tag: "Flash Deal",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAu84BkwcArXFKFKHMboxXW-J2ueE6EUG42dFzJ5m9T2Anpun7gmeF2ibsb2JpIpuTV1U_O2flT3t2cWWyPpgay5nCHKAi6pnfiOzKwtUWcI8g-ux_hSPGu5jsnoXEM8mDV9_8j1Ne8cdislcIbW-zTvbFtDX15acdM-jaK4sEhH5BZemWYAvsyeb8ATmR2pCwm8C1mdJOZZxoUb_kIeoN7qOb1bR_Bul-WEY2CBiJVvGs9VYQumDaJCxH2K5UaJUgrpUsLU41ejMk"
}

const HIGHLIGHT_REWARDS = [
  { id: 1, brand: "Energy Partner", title: "Free Gatorade Multipack", icon: <Zap className="w-16 h-16 text-secondary" />, color: "secondary" },
  { id: 2, brand: "Tech Drop", title: "Strava Premium 30 Days", icon: <Medal className="w-16 h-16 text-tertiary" />, color: "tertiary" }
]

const GRID_REWARDS = [
  { id: 3, brand: "Decathlon", title: "-10% Coupon Code", category: "Apparel & Gear", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBhHFAKXF84HMEludBS4qxWOFqQLSkCslR_TdL6qf_yD43OrTNUYkPA7JHMJ6JB6p9crozBtPz__yvYkyNqbQjH0-2QQCSNRlrYSNa-pc2FUxHM0WItJhtmaqg-a0fnRcP0nXEqn6LwJNm98o3Q_3bKbIyfqoHZ0SPi3nTSXneEHrGrdxOIQR1q_pOWLGabtpoulykVBcYqxb1qIc-q94aom1fHOXgYG8Q1mgi5IMz8T1vC0tUS3mllTEWb7_IheFpKgB52QRubRU" },
  { id: 4, brand: "MyProtein", title: "Free Whey Sample", category: "Nutrition", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHmCy9qm4oODLlqeYZ398yi0DPfFRgRoS5Lcmi83b0R_95cS-ajLq8DDryFNhGgVHsbeMi6okCU1n6N3SeqdsxR0O7N-dnOkQseiRQ-GAUX9F9zDmyCKTVJL0aFUmpDjgIqLv0ZLCYyaZaqdIB8uc_hvP7ddv3IUjbiEADPNE5T5M_bAt50nGbTPDpQRV2OdQoY7Lp3vArq5mhNcRZUmzwB9RkLUbV0La8NFOSby3NUeolzYvUwdzPpF944wtGO17H1qJ9kbLXTpI" },
  { id: 5, brand: "Lululemon", title: "Exclusive Headband", category: "Accessories", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyIfnqkpt_YrlKY23HLSPzMzRi5p3Zxtz7NXL2ZDY-phx7K6dtOZvgPyOTuXka4xKFOGfRBWJOspsfNrKb_C0DEI5uUGe7DvaA4Rkio8xZMLp_unFO-wsXOmASpd_s1KVNUcdyYHzw9E6RlHOm6mmN9tR_HEFixLB0FmgV1WS8QkEHGzj9cp_K8rxQvX-2cjTiVdMZx_wX_YQV5QvWfIR3o1Y4005MlO_Bgr-mNgDcIZn-O2oxUfjKrOCrwrT9Z4RekA6nV2HZt-Q" },
  { id: 6, brand: "CityRun", title: "5K Entry Ticket", category: "Events", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNlj1TXuOfgu1ivwnbnftkBAJjxotsQ8hdvRGxgq1lbvRy3tE7jLJb7-ON24lSYVuXkTkdmdWj63Q4AM6pOBKhMCuRcTjFp9_NTpR-t8zguyEZeNGHwCmttZGXunoNjtk9ZSr9U9pZDsHe2OBB7M_cY-2vzqmzBfHfzmczO2fs3pgzryYwyisku-zbvk43HPWA1apDcpLfoPnefL2MTBRsBdDW4D3cUXOVIzmrJPgk6FLjHoMSBIcU2979eKHUWgC-YOOC3wPJp8g" },
  { id: 7, brand: "BioSteel", title: "Electrolyte Tub", category: "Nutrition", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCt0SDI0eE-V4ZKNcSEyEJ3HH49mCtL0r4iag1lx1OjbhkfYHL4lcqJZyopWC0T1T-upejsMGtKw8mbWwvJNJWcQEenUPcYialHgjmsvp6fw28XX5D75W6bFanyTfdF54OWG5ygDCiYH5etfBTaHGhnwfHNHpIZllMNw2x3xBdTVpzuTgNHHyWShBLUiyxZYPpfYVxo0zJoxBX5XDuqDJC3p8RLokSnwog1R3lTcu_c12v45an61oM8-H-jXGe5xldt6ap9YgT61cg" },
  { id: 8, brand: "GymPass", title: "1 Month Gym Pass", category: "Fitness", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8eq0QKHOKryCR0QIsjWzhU_BcvF8vaGIxkyJZRnl5_47t0-08nsar0vIkvUb1huNv7hsbIS4xP8Fhpi4e_3SrIRteQQz3k8HHKCmwdoDRXUi_ngVKQHJYK6cPdHHoGttvaVg8dJQUEHKvRUnTvjKnga8IdPmcocaClU_m__2DIYSReFOrFh8WiAQCjCS0iUDDz3IkG23zLfBpHAGvmVjIhCdSyDWHUiCvRaw4DagePRitlAOEVtOSok9wol2rgFQTsi2274xL2c0" },
]
// --------------------

const FILTERS = ["All Rewards", "Gear", "Nutrition", "Events", "Digital", "Accessories", "Fitness"]

// Form visible only to the contract owner
function AdminPromoForm({ refetch }: { refetch: () => void }) {
  const { isOwner } = useIsOwner()
  const { addPromoCode, isLoading: isCreating, isSuccess, error } = useAddPromoCode()
  
  const [promoId, setPromoId] = useState("3") // Default to Decathlon id
  const [cost, setCost] = useState("250") // Default to 250 RUN
  const [showSuccess, setShowSuccess] = useState(false)

  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      refetch()
      const timer = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, refetch])

  if (!isOwner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addPromoCode(BigInt(promoId), parseEther(cost))
    } catch(err) {
       console.error(err)
    }
  }

  return (
    <section className="bg-surface-container-high rounded-xl p-6 glass border border-secondary/30 mb-10 shadow-ambient relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <ShieldAlert className="text-secondary w-5 h-5" />
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-secondary text-glow-secondary">
          Admin: Unlock Reward
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end relative z-10">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
            Target Promo ID
          </label>
          <input
            type="number" value={promoId} onChange={(e) => setPromoId(e.target.value)} required min="0" placeholder="e.g. 3 (Decathlon)"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-secondary rounded-xl px-4 py-2.5 text-foreground font-display outline-none transition-all placeholder:text-outline-variant"
          />
        </div>

        <div>
           <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
            Cost in RUN Tokens
          </label>
          <input
            type="number" step="1" value={cost} onChange={(e) => setCost(e.target.value)} required min="1"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-secondary rounded-xl px-4 py-2.5 text-foreground font-display outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-secondary to-secondary-container text-on-secondary font-display font-bold text-sm rounded-xl py-2.5 hover:opacity-90 transition-all duration-300 disabled:opacity-50 tracking-widest"
        >
          {isCreating ? "Unlocking..." : "Deploy Promo"}
        </button>
      </form>

      {showSuccess && (
        <div className="mt-4 p-3 rounded-xl glass bg-green-950/40 border border-green-500/50 text-green-400 text-xs font-bold animate-in fade-in duration-300">
           Promo Code {promoId} is now live and claimable!
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-400 text-xs font-bold">
           Error: {error.message}
        </div>
      )}
    </section>
  )
}

export default function RewardsMarketplacePage() {
  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState("All Rewards")
  
  const { data: activePromos, isLoading: isFetchingPromos, refetch } = useFetchPromoCodes()
  const { redeemPromoCode, isLoading: isRedeeming, isSuccess: isRedeemSuccess } = useRedeemPromoCode()
  
  const [claimingId, setClaimingId] = useState<number | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Hook to refetch promos logic (optional if we wanted balance refetch mostly)
  React.useEffect(() => {
    if (isRedeemSuccess) {
      alert("Success! The promo code has been burnt safely. Check your email.")
      setClaimingId(null)
    }
  }, [isRedeemSuccess])

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleClaim = async (id: number) => {
    setClaimingId(id)
    try {
      await redeemPromoCode(BigInt(id))
    } catch(err) {
      console.error(err)
      setClaimingId(null)
    }
  }

  // Helper to determine if a mock card is active on the blockchain
  const getPromoCost = (id: number): number => {
    if (!activePromos) return 0;
    const costWei = activePromos[id.toString()]
    return costWei ? Number(formatEther(costWei)) : 0
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-10">
      
      {/* Hero Section / Informational Banner */}
      <section className="relative overflow-hidden rounded-3xl p-8 glass border border-primary/20 bg-gradient-to-br from-surface-container to-surface shadow-ambient">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-primary mb-2 tracking-tighter uppercase text-glow-primary">REWARDS HUB</h2>
            <p className="font-sans text-on-surface-variant max-w-md font-medium text-lg leading-relaxed">
              Turn your kinetic energy into tangible value. Exclusive drops unlocked by the Admin.
            </p>
          </div>
          <div className="bg-surface-container-highest/60 backdrop-blur-md p-4 rounded-2xl border border-secondary/20 max-w-xs shadow-ambient">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <p className="text-xs font-display uppercase tracking-widest leading-relaxed text-secondary-fixed">
                Run tokens are non-transferable and burnt locally.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-secondary/10 blur-[100px] rounded-full pointer-events-none"></div>
      </section>

      {/* Admin Panel */}
      <AdminPromoForm refetch={refetch} />

      {/* Featured Carousel (Asymmetric) */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-display text-2xl font-bold tracking-tight uppercase text-foreground">Weekly Spotlight</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Hero Card */}
          <div className="md:col-span-8 group cursor-pointer relative overflow-hidden rounded-3xl h-[400px] border border-outline-variant/30 shadow-2xl bg-surface-container-low">
            <img 
              src={HERO_REWARD.image} 
              alt={HERO_REWARD.title} 
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${getPromoCost(HERO_REWARD.id) > 0 ? 'group-hover:scale-105' : 'grayscale opacity-50'}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col md:flex-row md:justify-between md:items-end gap-6">
              <div>
                <span className="bg-primary text-on-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block shadow-glow">
                  {HERO_REWARD.tag} (ID: {HERO_REWARD.id})
                </span>
                <h4 className="font-display text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase mb-2">
                  {HERO_REWARD.title}
                </h4>
                <p className="text-on-surface-variant text-sm font-medium">{HERO_REWARD.description}</p>
              </div>
              
              <div className="bg-surface-container-highest/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-primary/30 flex items-center justify-between md:flex-col gap-4">
                <div className="flex flex-col md:items-center">
                  <span className="text-[10px] font-display text-on-surface-variant tracking-widest uppercase font-bold mb-1">PRICE</span>
                  <span className={`font-display font-black text-2xl tracking-tight ${getPromoCost(HERO_REWARD.id) > 0 ? "text-primary" : "text-outline-variant"}`}>
                    {getPromoCost(HERO_REWARD.id) > 0 ? `${getPromoCost(HERO_REWARD.id)} RUN` : "Locked"}
                  </span>
                </div>
                <button 
                  onClick={() => handleClaim(HERO_REWARD.id)}
                  disabled={getPromoCost(HERO_REWARD.id) === 0 || claimingId === HERO_REWARD.id}
                  className="bg-primary text-on-primary rounded-full p-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claimingId === HERO_REWARD.id ? <CircleDashed className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Highlights Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {HIGHLIGHT_REWARDS.map(hr => {
              const activePrice = getPromoCost(hr.id);
              const isAvailable = activePrice > 0;

              return (
                <div key={hr.id} className={`bg-surface-container rounded-3xl p-6 border ${isAvailable ? 'border-outline-variant/50 hover:border-outline-variant' : 'border-outline-variant/10 opacity-70'} flex-1 flex flex-col justify-center relative overflow-hidden group transition-colors glass cursor-pointer`}>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <span className={`text-${hr.color} font-display text-[10px] uppercase font-bold tracking-widest mb-3 block`}>
                        {hr.brand} (ID: {hr.id})
                      </span>
                      <h4 className="font-display text-2xl font-black uppercase tracking-tight mb-6 pr-10">
                        {hr.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isAvailable ? (
                          <span className="text-primary font-display font-black text-xl">{activePrice} RUN</span>
                        ) : (
                          <span className="text-on-surface-variant font-display font-black text-sm uppercase tracking-widest">Locked</span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleClaim(hr.id)}
                        disabled={!isAvailable || claimingId === hr.id}
                        className="bg-surface-container-highest border border-outline-variant/50 hover:bg-surface-bright rounded-full p-2.5 transition-colors disabled:opacity-50 text-foreground"
                      >
                        {claimingId === hr.id ? <CircleDashed className="w-4 h-4 animate-spin text-primary" /> : <ShoppingBag className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className={`absolute -right-8 -bottom-8 transition-opacity duration-500 scale-150 ${isAvailable ? 'opacity-[0.15] group-hover:opacity-[0.3]' : 'opacity-5 grayscale'}`}>
                    {hr.icon}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* Marketplace Grid */}
      <section>
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar border-b border-surface-container">
          {FILTERS.map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)} 
              className={`px-6 py-2.5 rounded-full font-display text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeFilter === filter 
                  ? 'bg-primary text-on-primary border-primary shadow-glow' 
                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30 hover:border-outline-variant hover:text-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isFetchingPromos && (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {GRID_REWARDS.map(reward => {
             // Mock filter logic
             if(activeFilter !== "All Rewards" && reward.category !== activeFilter) return null;

             const activePrice = getPromoCost(reward.id);
             const isAvailable = activePrice > 0;

             return (
              <div 
                key={reward.id} 
                className={`bg-surface-container rounded-2xl overflow-hidden border transition-all duration-300 group flex flex-col ${
                  !isAvailable 
                    ? 'border-outline-variant/10 opacity-60' 
                    : 'border-outline-variant/30 hover:border-primary/50 shadow-ambient hover:shadow-glow cursor-pointer'
                }`}
              >
                <div className={`h-48 relative ${!isAvailable ? 'grayscale' : ''} overflow-hidden`}>
                  <img 
                    src={reward.image} 
                    alt={reward.brand} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute top-3 left-3 bg-surface/80 backdrop-blur-md px-3 py-1.5 border border-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-sm">
                    {reward.brand}
                  </div>
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-surface/60 flex items-center justify-center backdrop-blur-sm">
                      <span className="font-display font-black text-sm uppercase tracking-[0.2em] text-outline-variant bg-surface-container-highest/60 border border-outline-variant/50 px-4 py-2 rounded-xl backdrop-blur-md">
                        Locked
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <h5 className={`font-display font-bold text-lg leading-tight uppercase tracking-tight mb-1 transition-colors ${isAvailable ? 'text-foreground group-hover:text-primary' : 'text-on-surface-variant'}`}>
                    {reward.title}
                  </h5>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-6">
                    {reward.category} (ID: {reward.id})
                  </p>
                  
                  <div className="flex justify-between items-end mt-auto pt-4 border-t border-surface-container-highest">
                    <div>
                      {!isAvailable ? (
                        <span className="text-on-surface-variant font-display font-black text-xl line-through decoration-outline-variant/50">
                          Unavailable
                        </span>
                      ) : (
                        <span className="text-primary font-display font-black text-2xl tracking-tighter">
                          {activePrice} <span className="text-[12px] opacity-70 tracking-widest">RUN</span>
                        </span>
                      )}
                    </div>
                    
                    <button 
                      disabled={!isAvailable || claimingId === reward.id}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleClaim(reward.id)
                      }}
                      className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                        !isAvailable 
                          ? 'bg-surface-container-highest text-surface-variant cursor-not-allowed' 
                          : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary group-hover:shadow-glow'
                      }`}
                    >
                      {claimingId === reward.id ? (
                        <CircleDashed className="w-5 h-5 animate-spin" />
                      ) : (
                        <ShoppingBag className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
             )
          })}
        </div>
      </section>
      
    </div>
  )
}
