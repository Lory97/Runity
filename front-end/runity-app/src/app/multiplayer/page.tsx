'use client'

import React, { useState } from 'react'
import { parseEther, formatEther } from 'viem'
import { useAccount } from 'wagmi'
import {
  useCreateMultiChallenge,
  useFetchMultiPlayerState,
  useStakeMultiplayer,
  useApproveRunToken,
  useTokenAllowance,
  useSubmitMultiplayerResult,
  useResolveMultiChallenge,
  useHasSubmitted,
  useHasJoined,
  useIsOwner,
  useClaimRefund,
  generateMockBackendSignature
} from '@/hooks/useRunCore'
import { Users, Timer, Activity, Zap, ShieldAlert, CheckCircle2, Lock, RefreshCw, Trophy, Play, Gavel, ChevronDown, ChevronUp, Plus, Clock } from 'lucide-react'

// FORM COMPONENT
function CreateMultiChallengeForm({ refetch }: { refetch: () => void }) {
  const { createMultiChallenge, isLoading: isCreating, isSuccess, error: createError } = useCreateMultiChallenge()
  const { approve, isLoading: isApproving, isSuccess: isApproveSuccess, error: approveError } = useApproveRunToken()
  const { allowance, refetch: refetchAllowance } = useTokenAllowance()

  const [distance, setDistance] = useState("5000") // Default 5km
  const [timeMax, setTimeMax] = useState("3600")   // Default 1h
  const [stake, setStake] = useState("50")         // Default 50 RUN
  const [duration, setDuration] = useState("172800") // 48h to accept/play

  const [showSuccess, setShowSuccess] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const stakeBigInt = parseEther(stake || "0")
  const needsApproval = allowance < stakeBigInt

  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      refetch()
      refetchAllowance()
      const timer = setTimeout(() => setShowSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, refetch, refetchAllowance])

  React.useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (needsApproval) {
        await approve(stakeBigInt)
      } else {
        await createMultiChallenge(
          BigInt(distance),
          BigInt(timeMax),
          stakeBigInt,
          BigInt(duration)
        )
        // Reset defaults
        setDistance("5000")
        setTimeMax("3600")
        setStake("50")
        setDuration("172800")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const error = createError || approveError;

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
              Initiate New Challenge
            </h2>
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider opacity-70">
              Set the distance, stake, and timer for a new multiplayer arena
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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end relative z-10">
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
                <Timer className="w-3 h-3" /> Time Limit (s)
              </label>
              <input
                type="number" value={timeMax} onChange={(e) => setTimeMax(e.target.value)} required min="1"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/60 rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all shadow-inner-glow"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-primary mb-1 uppercase tracking-[0.2em]">
                <Zap className="w-3 h-3" /> Stake (RUN)
              </label>
              <input
                type="number" step="0.1" value={stake} onChange={(e) => setStake(e.target.value)} required min="0.1"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/60 rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all shadow-inner-glow"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold text-primary mb-1 uppercase tracking-[0.2em]">
                <Lock className="w-3 h-3" /> Expiry (s)
              </label>
              <input
                type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required min="3600"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/60 rounded-xl px-4 py-3 text-foreground font-display outline-none transition-all shadow-inner-glow"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || isApproving}
              className={`w-full font-display font-bold text-sm lg:text-base rounded-xl py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest h-[48px] flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-glow hover:scale-[1.02] active:scale-95`}
            >
              {isApproving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {isCreating ? "Deploying..." : (needsApproval ? "Approve" : "Create Arena")}
            </button>
          </form>

          {showSuccess && (
            <div className="mt-8 p-4 rounded-xl glass bg-green-950/40 border border-green-500/50 text-green-400 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
              <CheckCircle2 className="w-5 h-5" /> Challenge deployed! Waiting for competitors to match your stake.
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

// INDIVIDUAL CHALLENGE CARD
function ChallengeCard({ challenge, refetch }: { challenge: any, refetch: () => void }) {
  const { address, chainId } = useAccount()
  const { isOwner } = useIsOwner()
  const { approve, isLoading: isApproving, isSuccess: isApproveSuccess } = useApproveRunToken()
  const { stakeMultiplayer, isLoading: isJoining, isSuccess: isJoinSuccess } = useStakeMultiplayer()
  const { submitMultiplayerResult, isLoading: isSubmitting, isSuccess: isSubmitSuccess } = useSubmitMultiplayerResult()
  const { resolveMultiChallenge, isLoading: isResolving, isSuccess: isResolveSuccess } = useResolveMultiChallenge()
  const { claimRefund, isLoading: isRefunding, isSuccess: isRefundSuccess } = useClaimRefund()
  const { hasSubmitted, refetch: refetchHasSubmitted } = useHasSubmitted(challenge.challengeId)
  const { isJoined: isJoinedLive, refetch: refetchIsJoined } = useHasJoined(challenge.challengeId)
  const { allowance, refetch: refetchAllowance } = useTokenAllowance()

  const [showJoinSuccess, setShowJoinSuccess] = useState(false)
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false)

  const needsApproval = allowance < (challenge.stakeAmount || BigInt(0))

  React.useEffect(() => {
    if (isJoinSuccess) {
      setShowJoinSuccess(true)
      refetch()
      refetchAllowance()
    }
  }, [isJoinSuccess, refetch, refetchAllowance])

  React.useEffect(() => {
    if (isSubmitSuccess) {
      setShowSubmitSuccess(true)
      refetch()
      refetchHasSubmitted()
    }
  }, [isSubmitSuccess, refetch, refetchHasSubmitted])

  React.useEffect(() => {
    if (isResolveSuccess) {
      refetch()
    }
  }, [isResolveSuccess, refetch])

  React.useEffect(() => {
    if (isRefundSuccess) {
      refetch()
      refetchIsJoined()
    }
  }, [isRefundSuccess, refetch, refetchIsJoined])

  React.useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance()
      refetchIsJoined()
    }
  }, [isApproveSuccess, refetchAllowance, refetchIsJoined])

  const handleJoin = async () => {
    if (challenge.challengeId === undefined) return;
    try {
      if (needsApproval) {
        await approve(challenge.stakeAmount)
      } else {
        await stakeMultiplayer(challenge.challengeId)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmitResult = async () => {
    if (!address || !chainId) return;
    try {
      // Create mock run data for the target distance
      // For demo, we pick a random time that is valid (less than timeMax)
      const mockTime = BigInt(Math.floor(Number(challenge.timeMax) * (0.5 + Math.random() * 0.4)));
      
      const runData = {
        user: address as `0x${string}`,
        distance: challenge.distanceTarget,
        time: mockTime,
        date: BigInt(Math.floor(Date.now() / 1000)),
        steps: BigInt(5000),
        avgSpeed: (challenge.distanceTarget * BigInt(3600)) / mockTime,
        maxSpeed: (challenge.distanceTarget * BigInt(3600)) / mockTime + BigInt(2),
      };

      const signature = await generateMockBackendSignature(runData, chainId);
      await submitMultiplayerResult(challenge.challengeId, runData, signature);
    } catch (err) {
      console.error("Submission failed", err);
    }
  }

  const handleResolve = async () => {
    try {
      await resolveMultiChallenge(challenge.challengeId);
    } catch (err) {
      console.error("Resolution failed", err);
    }
  }

  const handleRefund = async () => {
    try {
      await claimRefund(challenge.challengeId);
    } catch (err) {
      console.error("Refund failed", err);
    }
  }

  const isCreator = address && challenge.creator?.toLowerCase() === address.toLowerCase();
  const isParticipating = address && (
    isCreator || 
    isJoinedLive ||
    challenge.challengers?.some((c: string) => c.toLowerCase() === address.toLowerCase())
  );
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const deadline = Number(challenge.deadline);
  const isExpired = now > deadline;
  const timeRemainingSeconds = Math.max(0, deadline - now);

  const formatRemainingTime = (seconds: number) => {
    if (seconds <= 0) return "Expired";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m left`;
  };

  const challengerCountNum = Number(challenge.challengerCount || 1)
  const isFull = challengerCountNum >= 50

  const distanceVal = Number(challenge.distanceTarget)
  const distanceStr = distanceVal >= 1000 ? `${(distanceVal / 1000).toFixed(2)} km` : `${distanceVal} m`
  const timeLimitVal = Number(challenge.timeMax)
  const timeLimitStr = timeLimitVal >= 3600 ? `${(timeLimitVal / 3600).toFixed(1)} hrs` : `${Math.floor(timeLimitVal / 60)} mins`

  const bestTimeVal = Number(challenge.bestTime)
  const bestTimeStr = bestTimeVal === Number(BigInt(2)**BigInt(256) - BigInt(1)) ? "No results yet" : 
    (bestTimeVal >= 3600 ? `${(bestTimeVal / 3600).toFixed(2)} hrs` : `${Math.floor(bestTimeVal / 60)}m ${bestTimeVal % 60}s`)

  // Calculate total pot
  const stakeValue = Number(formatEther(challenge.stakeAmount || BigInt(0)))
  const totalPot = stakeValue * challengerCountNum

  const hasWinner = challenge.winner && challenge.winner !== '0x0000000000000000000000000000000000000000';
  const canSubmit = isParticipating && !hasSubmitted && !isExpired && !challenge.isCompleted;
  const canResolve = (isParticipating || isOwner) && isExpired && !challenge.isCompleted && hasWinner;
  const canRefund = isJoinedLive && isExpired && !hasWinner;

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
              <p className="font-bold text-sm text-foreground">{timeLimitStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center border border-secondary/30">
              <Trophy className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-secondary font-bold">Best Performance</p>
              <p className="font-bold text-sm text-foreground">{bestTimeStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
              <Users className="w-4 h-4 text-on-surface" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Challengers</p>
              <p className="font-bold text-sm text-foreground">
                {challenge.challengerCount ? challenge.challengerCount.toString() : '1'} / 50
                {isParticipating && <span className="ml-2 text-[10px] text-primary">(You)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
              <Clock className="w-4 h-4 text-on-surface" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Expiration</p>
              <p className={`font-bold text-sm ${isExpired ? 'text-red-400' : 'text-foreground'}`}>
                {isExpired ? "Expired" : formatRemainingTime(timeRemainingSeconds)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {challenge.isCompleted ? (
          <div className="flex flex-col gap-2">
            <div className="w-full bg-green-950/20 border border-green-500/20 text-green-500 font-display font-bold text-sm rounded-lg py-3 flex flex-col items-center justify-center gap-1 uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Winner Declared
              </div>
              <span className="text-[10px] opacity-70 normal-case font-mono">{challenge.winner?.slice(0,6)}...{challenge.winner?.slice(-4)}</span>
            </div>
          </div>
        ) : showSubmitSuccess ? (
          <div className="text-center text-green-400 text-sm font-bold p-3 border border-green-500/30 rounded-lg animate-pulse">Result Submitted!</div>
        ) : canSubmit ? (
          <button
            onClick={handleSubmitResult}
            disabled={isSubmitting}
            className="w-full bg-secondary text-on-secondary shadow-glow-secondary font-display font-bold text-sm rounded-lg py-3 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Submit My Run
          </button>
        ) : canResolve ? (
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="w-full bg-primary text-on-primary shadow-glow font-display font-bold text-sm rounded-lg py-3 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {isResolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
            Resolve & Payout
          </button>
        ) : canRefund ? (
          <button
            onClick={handleRefund}
            disabled={isRefunding}
            className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 shadow-glow font-display font-bold text-sm rounded-lg py-3 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {isRefunding ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            Claim Refund
          </button>
        ) : isParticipating && hasSubmitted ? (
          <div className="w-full bg-surface-container-highest border border-primary/20 text-primary/70 font-display font-bold text-sm rounded-lg py-3 flex items-center justify-center gap-2 uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4" /> Awaiting Deadline
          </div>
        ) : isParticipating && !isExpired ? (
           <button className="w-full bg-transparent border border-primary text-primary font-display font-bold text-sm rounded-lg py-3 opacity-80 cursor-default uppercase tracking-widest">
            {showJoinSuccess ? "Staked!" : "Participating"}
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
            disabled={isJoining || isApproving}
            className={`w-full font-display font-bold text-sm rounded-lg py-3 transition-all uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 ${needsApproval ? 'bg-secondary text-on-secondary shadow-glow-secondary' : 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-glow'}`}
          >
            {isApproving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {isJoining ? 'Staking RUN...' : (needsApproval ? "Approve RUN" : `Join Battle`)}
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
