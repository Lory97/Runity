'use client'

import React, { useState } from 'react'
import { useIsOwner, useAddSoloChallenge, useFetchSoloChallengeEvents, useSubmitSoloRun, generateMockBackendSignature, RunData, useRunnerProfile } from '@/hooks/useRunCore'
import { useAccount, useChainId } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { PlusCircle, Activity, Timer, Zap, Loader2, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Plus, Lock } from 'lucide-react'

// Sub-component for Admin Form
function AdminChallengeForm({ refetch }: { refetch: () => void }) {
  const { isOwner, isLoading: isOwnerLoading } = useIsOwner()
  const { addSoloChallenge, isLoading: isAdding, isSuccess, error } = useAddSoloChallenge()

  const [distance, setDistance] = useState("5000") // Default 5000m (5km)
  const [timeMax, setTimeMax] = useState("3600")   // Default 3600s (1 hour)
  const [reward, setReward] = useState("10")       // Default 10 RUN
  const [showSuccess, setShowSuccess] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      refetch()
      const timer = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, refetch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addSoloChallenge(BigInt(distance), BigInt(timeMax), parseEther(reward))
      setDistance("5000")
      setTimeMax("3600")
      setReward("10")
    } catch (err) {
      console.error(err)
    }
  }

  if (isOwnerLoading) return null;
  if (!isOwner) return null;

  return (
    <div className="mb-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group w-full flex items-center justify-between p-6 rounded-xl glass border transition-all duration-500 shadow-ambient ${
          isOpen 
          ? 'bg-primary/10 border-primary/40 rounded-b-none' 
          : 'bg-surface-container-high border-primary/20 hover:border-primary/50'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
            isOpen ? 'bg-primary text-on-primary rotate-90' : 'bg-primary/20 text-primary'
          }`}>
            <Plus className={`w-6 h-6 transition-transform duration-500 ${isOpen ? 'rotate-45' : ''}`} />
          </div>
          <div className="text-left">
            <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary text-glow-primary">
              Admin: Add Solo Challenge
            </h2>
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider opacity-70">
              Create a new rewards baseline for individual runners
            </p>
          </div>
        </div>
        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-6 h-6 text-primary/50" />
        </div>
      </button>

      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <section className="bg-surface-container-high p-8 glass border-x border-b border-primary/40 rounded-b-xl shadow-ambient relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-primary mb-1 uppercase tracking-[0.2em]">
                <Activity className="w-3 h-3" /> Distance (m)
              </label>
              <input
                type="number" value={distance} onChange={(e) => setDistance(e.target.value)} required min="1"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/60 rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all shadow-inner-glow"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-primary mb-1 uppercase tracking-[0.2em]">
                <Timer className="w-3 h-3" /> Max Time (s)
              </label>
              <input
                type="number" value={timeMax} onChange={(e) => setTimeMax(e.target.value)} required min="1"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/60 rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all shadow-inner-glow"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-primary mb-1 uppercase tracking-[0.2em]">
                <Zap className="w-3 h-3" /> Reward (RUN)
              </label>
              <input
                type="number" step="0.1" value={reward} onChange={(e) => setReward(e.target.value)} required min="0.1"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/60 rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all shadow-inner-glow"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className={`w-full font-display font-bold text-sm lg:text-base rounded-xl py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest h-[48px] flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-glow hover:scale-[1.02] active:scale-95`}
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              {isAdding ? "Creating..." : "Create Challenge"}
            </button>
          </form>

          {showSuccess && (
            <div className="mt-8 p-4 rounded-xl glass bg-green-950/40 border border-green-500/50 text-green-400 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
              <CheckCircle2 className="w-5 h-5" /> Solo challenge successfully deployed to the blockchain!
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 text-xs font-bold animate-in shake duration-500">
              Error: {error.message}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SoloChallengeCard({ ev }: { ev: any }) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { submitSoloRun, isLoading: isContractLoading, isSuccess } = useSubmitSoloRun()
  const { profile } = useRunnerProfile()

  const [isSimulating, setIsSimulating] = useState(false)
  const isRegistered = profile?.isRegistered;

  const distanceVal = Number(ev.distance);
  const distanceStr = distanceVal >= 1000 ? `${(distanceVal / 1000).toFixed(2)} km` : `${distanceVal} m`
  
  const timeVal = Number(ev.timeMax);
  const timeStr = timeVal >= 3600 ? `${(timeVal / 3600).toFixed(1)} hrs` : `${Math.floor(timeVal / 60)} mins`

  const alreadyCompleted = ev.isCompleted;

  const handleClaim = async () => {
    if (alreadyCompleted) return;
    if (!address) return alert("Please connect your wallet");
    if (!isRegistered) return alert("You must register your Runner Profile on the Dashboard before submitting runs!");

    try {
      setIsSimulating(true)
      // 1. Simulate frontend Strava API call (2 seconds delay)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 2. Mock a valid RunData object that beats the challenge
      const mockData: RunData = {
        user: address,
        distance: ev.distance + BigInt(500), // Slightly more than required
        time: ev.timeMax - BigInt(60),       // 1 minute faster than max time
        date: BigInt(Math.floor(Date.now() / 1000)),
        steps: BigInt(6000),
        avgSpeed: BigInt(12),
        maxSpeed: BigInt(15)
      }

      // 3. Generate the magic backend signature directly in frontend (Demo purposes)
      const signature = await generateMockBackendSignature(mockData, chainId)

      // 4. Submit to smart contract
      await submitSoloRun(ev.challengeId, mockData, signature)

    } catch (err: any) {
      console.error(err)
      alert(err?.shortMessage || "Failed to submit run or invalid signature.");
    } finally {
      setIsSimulating(false)
    }
  }

  const isLoading = isSimulating || isContractLoading;
  
  let btnText = "Sync Strava & Validate"
  let btnClass = "w-full bg-transparent border border-outline-variant group-hover:border-primary text-foreground group-hover:text-primary font-display font-bold text-sm rounded-lg py-2 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
  
  if (alreadyCompleted || isSuccess) {
    btnText = "Challenge Complete"
    btnClass = "w-full bg-green-500/20 border border-transparent text-green-400 font-display font-bold text-sm rounded-lg py-2 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2 opacity-100 cursor-not-allowed"
  } else if (isSimulating) {
    btnText = "Fetching Strava..."
    btnClass = "w-full bg-secondary/20 border border-secondary/50 text-secondary font-display font-bold text-sm rounded-lg py-2 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
  } else if (isContractLoading) {
    btnText = "Broadcasting tx..."
    btnClass = "w-full bg-primary/20 border border-primary/50 text-primary font-display font-bold text-sm rounded-lg py-2 transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
  } 

  return (
    <div className={`bg-surface-container rounded-xl p-6 glass border transition-colors shadow-ambient group relative overflow-hidden flex flex-col justify-between ${alreadyCompleted ? 'border-green-500/30 opacity-70 cursor-default' : 'border-outline-variant hover:border-primary/50 cursor-pointer'}`}>
      {!alreadyCompleted && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-3xl rounded-full translate-x-10 -translate-y-10 transition-colors duration-500 pointer-events-none"></div>}

      <div>
        <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1">Challenge #{ev.challengeId?.toString() || '?'}</p>
              <h4 className="font-display text-xl font-bold text-foreground">Sprint & Earn</h4>
            </div>
            <div className="bg-surface-container-highest px-3 py-1 rounded-full border border-primary/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary">+{formatEther(ev.reward || BigInt(0))} $RUN</span>
            </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                <Activity className="w-4 h-4 text-on-surface" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Target Distance</p>
                <p className="font-bold text-sm text-foreground">{distanceStr}</p>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                <Timer className="w-4 h-4 text-on-surface" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Time Limit</p>
                <p className="font-bold text-sm text-foreground">{timeStr}</p>
              </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleClaim}
        disabled={isLoading || isSuccess}
        className={btnClass}
      >
        {isSimulating && <RefreshCw className="w-4 h-4 animate-spin text-secondary" />}
        {isContractLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-green-400" />}
        {btnText}
      </button>
    </div>
  )
}


export default function SoloPage() {
  const [mounted, setMounted] = useState(false);
  const { data: events, isLoading, isError, error, refetch } = useFetchSoloChallengeEvents()
  const { error: ownerError } = useIsOwner()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <header className="mb-10 text-center md:text-left">
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter text-glow-primary mb-2">
          Solo Mode
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-lg font-medium">
          Take on active challenges individually. Meet the distance and time requirements to earn RUN tokens.
        </p>
      </header>

      {/* Admin Panel */}
      <AdminChallengeForm refetch={refetch} />
      
      {ownerError && (
        <div className="text-xs text-red-500 mb-4 p-2 border border-red-500/30 rounded">
          Admin check error: {ownerError.message}
        </div>
      )}

      <h3 className="font-display text-2xl font-bold mb-6 text-foreground tracking-wide border-b border-surface-container h-10">
        Available Challenges
      </h3>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-10 glass rounded-xl border border-red-500/50">
          <p className="text-red-400 font-bold mb-2">Failed to fetch solo challenges from the blockchain.</p>
          <pre className="text-xs text-red-300 text-left overflow-x-auto p-4 bg-red-950/20 rounded">
            {error?.message || String(error)}
          </pre>
        </div>
      )}

      {!isLoading && !isError && events?.length === 0 && (
        <div className="text-center py-20 glass rounded-xl border border-outline-variant/50">
          <p className="text-on-surface-variant text-lg">No solo challenges are currently available.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((ev, index) => (
          <SoloChallengeCard 
            key={`${ev.challengeId?.toString() || 'unknown'}-${index}`} 
            ev={ev} 
          />
        ))}
      </div>

    </div>
  )
}
