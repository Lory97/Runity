'use client'

import React from 'react'
import { ArrowRight, Zap, Target, Coins, Shield, Globe, Cpu } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="bg-surface text-foreground font-sans overflow-x-hidden min-h-screen">
      
      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        {/* Animated Background Pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(142,255,113,0.05)_0%,transparent_70%)] animate-[pulse_8s_ease-in-out_infinite]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left">
          <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-[10px] font-display font-black uppercase tracking-[0.3em] text-primary text-glow-primary">
              The Next Evolution of Performance
            </span>
          </div>
          
          <h1 className="font-display text-6xl md:text-8xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter uppercase mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            RUN TO <span className="text-primary text-glow-primary">EARN.</span><br />
            MOVE TO <span className="text-secondary text-glow-secondary">WIN.</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
            Turn your daily steps into kinetic rewards. Join the <span className="text-foreground font-bold italic">Runity</span> elite and experience a dynamic digital ecosystem that rewards every kilometer.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
            <appkit-button />
            <button className="flex items-center gap-2 text-on-surface font-display font-bold uppercase tracking-widest hover:text-primary transition-colors group">
              Whitepaper <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hero Visual Decals */}
        <div className="absolute right-[-10%] top-[20%] hidden lg:block opacity-20 pointer-events-none">
          <div className="font-display text-[20rem] font-black leading-none text-outline-variant select-none">
            01
          </div>
        </div>
      </section>

      {/* 2. Stats Ticker */}
      <section className="border-y border-outline-variant/10 py-10 bg-surface-container-lowest/50 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="flex flex-col md:items-center">
            <span className="text-[10px] font-display font-bold text-outline-variant uppercase tracking-widest mb-1">Current Velocity</span>
            <span className="font-display text-3xl font-black text-foreground">14.2 <span className="text-sm opacity-50">km/h</span></span>
          </div>
          <div className="flex flex-col md:items-center">
            <span className="text-[10px] font-display font-bold text-outline-variant uppercase tracking-widest mb-1">Kinetic Rewards</span>
            <span className="font-display text-3xl font-black text-primary text-glow-primary">+24.5 <span className="text-sm opacity-50">$RUN</span></span>
          </div>
          <div className="flex flex-col md:items-center">
            <span className="text-[10px] font-display font-bold text-outline-variant uppercase tracking-widest mb-1">Active Runners</span>
            <span className="font-display text-3xl font-black text-foreground">200K+</span>
          </div>
          <div className="flex flex-col md:items-center">
            <span className="text-[10px] font-display font-bold text-outline-variant uppercase tracking-widest mb-1">Total Distance</span>
            <span className="font-display text-3xl font-black text-foreground">1.2M <span className="text-sm opacity-50">km</span></span>
          </div>
        </div>
      </section>

      {/* 3. Features: Engineered to Evolve */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
            <div>
              <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">Engineered<br/><span className="text-primary">to Evolve</span></h2>
              <p className="text-on-surface-variant font-medium max-w-sm">A seamless bridge between physical effort and digital value.</p>
            </div>
            <div className="text-outline-variant font-display text-8xl font-black opacity-20 hidden md:block select-none">
              TECH
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Feature 1 */}
            <div className="bg-surface-container hover:bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 group transition-all relative overflow-hidden">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-primary/20 shadow-glow transition-transform group-hover:-translate-y-1">
                <Globe className="text-primary w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight mb-4">Connect</h3>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                Seamlessly sync with Strava, Apple Health, or Garmin. Your performance data is your currency on the blockchain.
              </p>
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                 <Cpu className="w-32 h-32" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-container hover:bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 group transition-all relative overflow-hidden">
              <div className="bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-secondary/20 shadow-glow-secondary transition-transform group-hover:-translate-y-1">
                <Zap className="text-secondary w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight mb-4">Run</h3>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                Enter the arena. Run solo to beat personal records or join high-stakes multiplayer lobbies for massive rewards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-container hover:bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 group transition-all relative overflow-hidden">
              <div className="bg-tertiary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-tertiary/20 shadow-glow-tertiary transition-transform group-hover:-translate-y-1">
                <Coins className="text-tertiary w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight mb-4">Earn</h3>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                Collect $RUN tokens for every kilometer. Redeem for elite gear, marketplace discounts, or kinetic power-ups.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Token Section: THE RUN TOKEN */}
      <section className="py-32 px-6 bg-surface-container-lowest relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20 relative z-10">
          <div className="flex-1 order-2 md:order-1">
            <div className="relative">
              <div className="absolute -inset-20 bg-primary/20 blur-[120px] rounded-full"></div>
              <div className="relative z-10 w-full aspect-square max-w-sm mx-auto bg-gradient-to-br from-primary to-primary-container rounded-[2.5rem] flex items-center justify-center shadow-glow border border-white/20 rotate-12">
                 <span className="font-display text-9xl font-black text-on-primary select-none">$R</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 order-1 md:order-2">
            <h2 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
              THE <span className="text-primary text-glow-primary">RUN</span> TOKEN.
            </h2>
            <p className="text-lg text-on-surface-variant font-medium leading-relaxed mb-10">
              $RUN is the fuel of the Runity ecosystem. It’s not just a points system—it’s a dynamic digital asset that rewards consistency, speed, and competitive spirit.
            </p>
            
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="bg-primary/20 p-1.5 rounded-full mt-1"><Shield className="w-4 h-4 text-primary" /></div>
                <div>
                   <h4 className="font-display font-bold uppercase text-foreground">Burn for Boosts</h4>
                   <p className="text-sm text-on-surface-variant">Enhance your kinetic suit's efficiency for 24 hours.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-primary/20 p-1.5 rounded-full mt-1"><Target className="w-4 h-4 text-primary" /></div>
                <div>
                   <h4 className="font-display font-bold uppercase text-foreground">Exclusive Marketplace</h4>
                   <p className="text-sm text-on-surface-variant">Unlock limited edition digital apparel from top athletic brands.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-secondary/5 blur-[100px] rounded-full"></div>
      </section>

      {/* 5. CTA: Ready to Breach */}
      <section className="py-40 px-6 relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-display text-5xl md:text-8xl font-black uppercase tracking-tighter mb-10 leading-[0.85]">
            READY TO <span className="text-primary">BREACH</span> THE HORIZON?
          </h2>
          <p className="text-xl text-on-surface-variant font-medium mb-12">
            Join 200,000+ athletes already transforming their miles into momentum. Your journey starts now.
          </p>
          <div className="flex justify-center scale-150">
            <appkit-button />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-outline-variant/10 text-center">
        <div className="flex justify-center space-x-10 mb-10">
          <a href="#" className="text-xs uppercase tracking-[0.2em] font-black text-outline-variant hover:text-primary transition-colors">Whitepaper</a>
          <a href="#" className="text-xs uppercase tracking-[0.2em] font-black text-outline-variant hover:text-primary transition-colors">Tokenomics</a>
          <a href="#" className="text-xs uppercase tracking-[0.2em] font-black text-outline-variant hover:text-primary transition-colors">Support</a>
        </div>
        <p className="text-[10px] font-display font-bold text-outline-variant uppercase tracking-[0.4em]">
          © 2026 RUNITY KINETIC. ALL RIGHTS RESERVED.
        </p>
      </footer>

    </div>
  )
}
