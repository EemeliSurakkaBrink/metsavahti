'use client'

import dynamic from 'next/dynamic'

import type { WatchAreaMapProps } from '@/components/map/watch-area-map'

// MapLibre touches `window`; keep it out of the server bundle.
const WatchAreaMap = dynamic(
  () => import('@/components/map/watch-area-map').then((m) => m.WatchAreaMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[420px] w-full animate-pulse rounded-md bg-muted"
        data-testid="map-loading"
      />
    ),
  },
)

export function WatchAreaMapClient(props: WatchAreaMapProps) {
  return <WatchAreaMap {...props} />
}
