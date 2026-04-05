'use client'

import React, { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Trophy, Activity, Flag, Plus, RefreshCw } from 'lucide-react'
import { useRunnerProfile, useRegisterRunner } from '@/hooks/useRunCore'

export function ProfileModule() {
  const { address } = useAccount()
  const { profile, isLoading, refetch } = useRunnerProfile()
  const { registerRunner, isSuccess: registered, isLoading: isRegistering } = useRegisterRunner()

  useEffect(() => {
    if (registered) {
      refetch()
    }
  }, [registered, refetch])

  if (!address) {
    return (
      <div className="bg-surface-container-high rounded-xl p-8 glass border border-outline-variant flex flex-col items-center justify-center text-center shadow-ambient h-full">
        <Activity className="w-12 h-12 text-outline-variant mb-4" />
        <h3 className="font-display font-bold text-xl text-on-surface-variant uppercase tracking-widest mb-2">Wallet Disconnected</h3>
        <p className="text-sm font-medium text-surface-variant">Connect your Web3 wallet to access your Runner Profile.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-surface-container-high rounded-xl p-8 glass border border-outline-variant flex items-center justify-center shadow-ambient h-full">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Handle Unregistered State
  if (!profile || !profile.isRegistered) {
    return (
      <div className="bg-surface-container-high rounded-xl p-6 glass border border-secondary/30 relative overflow-hidden shadow-ambient h-full flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-3xl rounded-full translate-x-12 -translate-y-12 pointer-events-none"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4 border border-secondary/20 shadow-glow-secondary">
            <Plus className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-2xl font-display font-black text-foreground mb-2 text-glow-secondary uppercase tracking-tight">Mint Profile</h3>
          <p className="text-sm text-on-surface-variant font-medium mb-6 px-4">
            Initialize your soulbound Runner profile on the blockchain to track distance and compete.
          </p>

          <button 
            disabled={isRegistering}
            onClick={() => registerRunner()}
            className="w-full bg-gradient-to-r from-secondary to-secondary-container text-on-secondary font-display font-bold text-lg rounded-full py-3 hover:opacity-90 hover:shadow-glow-secondary transition-all duration-300 disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {isRegistering ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Sign TX: Register"}
          </button>
        </div>
      </div>
    )
  }

  // Handle Registered Profile State
  return (
    <div className="bg-surface-container rounded-xl p-6 glass border border-primary/20 hover:border-primary/50 transition-colors relative overflow-hidden shadow-ambient h-full">
      <div className="flex items-center justify-between mb-8 relative z-10 border-b border-outline-variant/30 pb-4">
        <div>
          <h3 className="text-2xl font-display font-black text-foreground uppercase tracking-tight text-glow-primary">Player Stats</h3>
          <p className="text-[10px] font-mono text-outline uppercase tracking-widest truncate max-w-[150px]">{address}</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-full border border-primary/30 shadow-glow">
          <Activity className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* Total Distance */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-highest p-2 rounded-lg border border-outline-variant/50 group-hover:border-primary transition-colors">
              <Flag className="w-4 h-4 text-secondary" />
            </div>
            <span className="font-sans font-bold text-on-surface-variant uppercase text-xs tracking-wider">Total Distance</span>
          </div>
          <span className="font-display font-black text-xl text-foreground">
            {profile.totalDistance.toString()} <span className="text-xs text-outline-variant tracking-widest">KM</span>
          </span>
        </div>

        {/* Challenges Played */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-highest p-2 rounded-lg border border-outline-variant/50 group-hover:border-primary transition-colors">
              <Activity className="w-4 h-4 text-tertiary" />
            </div>
            <span className="font-sans font-bold text-on-surface-variant uppercase text-xs tracking-wider">Matches Played</span>
          </div>
          <span className="font-display font-black text-xl text-foreground">
            {profile.challengesPlayed.toString()}
          </span>
        </div>

        {/* Challenges Won */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-highest p-2 rounded-lg border border-outline-variant/50 group-hover:border-primary transition-colors">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <span className="font-sans font-bold text-on-surface-variant uppercase text-xs tracking-wider">Global Wins</span>
          </div>
          <span className="font-display font-black text-xl text-primary text-glow-primary">
            {profile.challengesWon.toString()}
          </span>
        </div>

      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
    </div>
  )
}
