'use client'

import { useAccount } from 'wagmi'
import { BalanceGauge } from '@/components/ui/BalanceGauge'
import { ProfileModule } from '@/components/ui/ProfileModule'
import { LandingPage } from '@/components/landing/LandingPage'
import Link from 'next/link'
import { useFetchUserActivity } from '@/hooks/useRunCore'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { isConnected } = useAccount()
  const { data: recentActivity, isLoading } = useFetchUserActivity()

  if (!isConnected) {
    return <LandingPage />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="space-y-10">
        <section>
          <BalanceGauge />
        </section>

        <section className="bg-surface-container rounded-xl p-6 glass border border-outline-variant hover:border-outline/30 transition-colors shadow-ambient">
          <h3 className="font-display text-xl font-bold mb-6 text-glow-primary tracking-wide">Recent Activity</h3>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-surface-bright transition-colors cursor-pointer group">
                  <div>
                    <p className="font-bold text-foreground">{activity.title}</p>
                    <p className="text-xs text-on-surface-variant font-medium">{activity.hint}</p>
                  </div>
                  <span className={`font-bold transition-all ${activity.isPositive ? 'text-primary group-hover:text-glow-primary' : 'text-secondary'}`}>
                    {activity.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-on-surface-variant italic">No recent activity detected.</p>
            </div>
          )}
        </section>
      </div>

      <div className="space-y-10">
        <ProfileModule />

        <section className="bg-surface-container-high rounded-xl p-6 glass shadow-ambient border border-outline-variant hover:border-outline/30 transition-colors relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-display text-xl font-bold mb-4 uppercase tracking-widest text-primary">Exchange Rewards</h3>
            <p className="text-sm font-medium text-on-surface-variant mb-6">Trade your RUN tokens for exclusive partner discounts.</p>
            <Link href="/marketplace">
              <button className="bg-transparent border border-outline-variant/50 text-primary font-bold py-2 px-6 rounded-full hover:border-primary hover:bg-primary/5 transition-all duration-300 uppercase tracking-widest text-sm">
                View Marketplace
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
