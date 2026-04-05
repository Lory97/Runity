'use client'

import React, { useState } from 'react'
import { parseEther, formatEther } from 'viem'
import { useAccount } from 'wagmi'
import {
  useCreateMultiChallenge,
  useFetchMultiPlayerState,
  useStakeMultiplayer
} from '@/hooks/useRunCore'
import { Users, Timer, Activity, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react'

// FORM COMPONENT
function CreateMultiChallengeForm({ refetch }: { refetch: () => void }) {
  const { createMultiChallenge, isLoading: isCreating, isSuccess, error } = useCreateMultiChallenge()

  const [distance, setDistance] = useState("5000") // Default 5km
  const [timeMax, setTimeMax] = useState("3600")   // Default 1h
  const [stake, setStake] = useState("50")         // Default 50 RUN
  const [duration, setDuration] = useState("172800") // 48h to accept/play

  const [showSuccess, setShowSuccess] = useState(false)

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
      await createMultiChallenge(
        BigInt(distance),
        BigInt(timeMax),
        parseEther(stake),
        BigInt(duration)
      )
      // Reset defaults
      setDistance("5000")
      setTimeMax("3600")
      setStake("50")
      setDuration("172800")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section className="bg-surface-container-high rounded-xl p-6 glass border border-primary/20 hover:border-primary/50 transition-colors shadow-ambient mb-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <Users className="text-primary w-6 h-6" />
        <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary text-glow-primary">
          Initiate New Challenge
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end relative z-10">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
            Distance (m)
          </label>
          <input
            type="number" value={distance} onChange={(e) => setDistance(e.target.value)} required min="1"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
            Time Limit (s)
          </label>
          <input
            type="number" value={timeMax} onChange={(e) => setTimeMax(e.target.value)} required min="1"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
            Stake (RUN)
          </label>
          <input
            type="number" step="0.1" value={stake} onChange={(e) => setStake(e.target.value)} required min="0.1"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">
            Match Expiry (s)
          </label>
          <input
            type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required min="3600"
            className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-display font-bold text-sm lg:text-base rounded-xl py-3 hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider h-[46px]"
        >
          {isCreating ? "Deploying..." : "Create"}
        </button>
      </form>

      {showSuccess && (
        <div className="mt-6 p-4 rounded-xl glass bg-green-950/40 border border-green-500/50 text-green-400 text-sm font-bold flex items-center gap-3 animate-in fade-in duration-300">
          Challenge deployed! Waiting for others to match your stake.
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

// INDIVIDUAL CHALLENGE CARD
function ChallengeCard({ challenge, refetch }: { challenge: any, refetch: () => void }) {
  const { address } = useAccount()
  const { stakeMultiplayer, isLoading: isJoining, isSuccess } = useStakeMultiplayer()
  const [showJoinSuccess, setShowJoinSuccess] = useState(false)

  React.useEffect(() => {
    if (isSuccess) {
      setShowJoinSuccess(true)
      refetch()
    }
  }, [isSuccess, refetch])

  const handleJoin = async () => {
    if (challenge.challengeId === undefined) return;
    try {
      await stakeMultiplayer(challenge.challengeId)
    } catch (err) {
      console.error(err)
    }
  }

  const isParticipating = address && challenge.challengers?.some((c: string) => c.toLowerCase() === address.toLowerCase())
  const isExpired = Date.now() / 1000 > Number(challenge.deadline)
  const isFull = challenge.challengers?.length >= 50

  const distanceVal = Number(challenge.distanceTarget)
  const distanceStr = distanceVal >= 1000 ? `${(distanceVal / 1000).toFixed(2)} km` : `${distanceVal} m`
  const timeVal = Number(challenge.timeMax)
  const timeStr = timeVal >= 3600 ? `${(timeVal / 3600).toFixed(1)} hrs` : `${Math.floor(timeVal / 60)} mins`

  // Calculate total pot
  const stakeValue = Number(formatEther(challenge.stakeAmount || BigInt(0)))
  const totalPot = stakeValue * (challenge.challengers?.length || 1)

  return (
    <div className={`bg-surface-container rounded-xl p-6 glass border transition-colors shadow-ambient relative overflow-hidden flex flex-col justify-between ${challenge.isCompleted ? 'border-green-500/30' : 'border-outline-variant hover:border-primary/50'}`}>
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1">ID #{challenge.challengeId?.toString()}</p>
            <h4 className="font-display text-xl font-bold text-foreground">
              {challenge.isCompleted ? 'Finished Battle' : 'Open Match'}
            </h4>
          </div>

          <div className={`px-3 py-1 rounded-full border flex items-center gap-1 ${challenge.isCompleted ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-surface-container-highest border-primary/30 text-primary'}`}>
            <Zap className="w-3 h-3" />
            <span className="text-xs font-bold uppercase">Pot: {totalPot} RUN</span>
          </div>
        </div>

        <div className="space-y-4 mb-8">
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

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
              <Users className="w-4 h-4 text-on-surface" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Challengers</p>
              <p className="font-bold text-sm text-foreground">
                {challenge.challengers?.length || 1} / 50
                {isParticipating && <span className="ml-2 text-[10px] text-primary">(You)</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {challenge.isCompleted ? (
          <div className="w-full bg-green-950/20 border border-green-500/20 text-green-500 font-display font-bold text-sm rounded-lg py-3 flex items-center justify-center gap-2 uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4" /> Winner Found
          </div>
        ) : showJoinSuccess ? (
          <div className="text-center text-green-400 text-sm font-bold p-3 border border-green-500/30 rounded-lg">Staked successfully!</div>
        ) : isParticipating ? (
          <button className="w-full bg-transparent border border-primary text-primary font-display font-bold text-sm rounded-lg py-3 opacity-80 cursor-default uppercase tracking-widest">
            Participating
          </button>
        ) : isExpired ? (
          <button disabled className="w-full bg-surface-container-highest border border-outline-variant text-on-surface-variant font-display font-bold text-sm rounded-lg py-3 opacity-50 cursor-not-allowed uppercase tracking-widest">
            Expired
          </button>
        ) : isFull ? (
          <button disabled className="w-full bg-surface-container-highest border border-outline-variant text-on-surface-variant font-display font-bold text-sm rounded-lg py-3 opacity-50 cursor-not-allowed uppercase tracking-widest">
            Max Capacity
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-display font-bold text-sm rounded-lg py-3 hover:opacity-90 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            {isJoining ? 'Staking RUN...' : `Stake ${stakeValue} RUN to Join`}
          </button>
        )}
      </div>
    </div>
  )
}


export default function MultiplayerPage() {
  const [mounted, setMounted] = useState(false);
  const { data: challenges, isLoading, isError, error, refetch } = useFetchMultiPlayerState()

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
          Multiplayer Stakes
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-lg font-medium">
          Put your RUN tokens where your legs are. Create challenges or join existing ones. Winner takes the pot.
        </p>
      </header>

      {/* Admin Panel */}
      <CreateMultiChallengeForm refetch={refetch} />

      <h3 className="font-display text-2xl font-bold mb-6 text-foreground tracking-wide border-b border-surface-container h-10">
        Active Arenas
      </h3>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {isError && (
        <div className="text-center py-10 glass rounded-xl border border-red-500/50">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-400 font-bold mb-2">Network sync failed.</p>
          <pre className="text-xs text-red-300 text-left overflow-x-auto p-4 bg-red-950/20 rounded mx-4 md:mx-10">
            {error?.message || String(error)}
          </pre>
        </div>
      )}

      {!isLoading && !isError && challenges?.length === 0 && (
        <div className="text-center py-20 glass rounded-xl border border-outline-variant/50">
          <p className="text-on-surface-variant text-lg">No multiplayer challenges deployed right now. Be the first to start the race!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges?.map((challenge: any, index: number) => (
          <ChallengeCard
            key={`${challenge.challengeId?.toString() || index}`}
            challenge={challenge}
            refetch={refetch}
          />
        ))}
      </div>

    </div>
  )
}
