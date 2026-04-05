'use client'

import React from 'react'
import { formatEther } from 'viem'
import { useRunTokenBalance } from '@/hooks/useRunCore'

export function BalanceGauge() {
  const { balance, isLoading } = useRunTokenBalance()
  
  // Format from wei (assuming 18 decimals) and round to generic number
  const formattedBalance = balance ? parseFloat(formatEther(balance)) : 0;
  
  const max = 10000;
  const percentage = Math.min((formattedBalance / max) * 100, 100);
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="bg-surface-container-high rounded-xl p-6 glass relative overflow-hidden shadow-ambient border border-outline-variant hover:border-outline/30 transition-colors">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/10 blur-3xl"></div>
      
      <div className="flex flex-col items-center relative z-10">
        <h3 className="text-xs font-display text-on-surface-variant font-bold uppercase tracking-widest mb-6">Run Token Balance</h3>
        
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* SVG Circular Progress */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
             <circle 
               className="text-surface-container-lowest stroke-current opacity-50" 
               strokeWidth="8" 
               cx="50" cy="50" r="40" 
               fill="transparent" 
             />
             <circle 
               className="text-primary stroke-current transition-all duration-1000 ease-out" 
               strokeWidth="8" 
               strokeDasharray={strokeDasharray} 
               strokeLinecap="round" 
               cx="50" cy="50" r="40" 
               fill="transparent" 
             />
          </svg>
          
           <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="font-display text-4xl text-foreground font-bold text-glow-primary">
               {isLoading ? '...' : Math.floor(formattedBalance).toLocaleString('en-US')}
             </span>
             <span className="text-xs text-outline mt-1 font-bold">/ {max.toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
