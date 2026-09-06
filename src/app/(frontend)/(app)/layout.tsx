import type { ReactNode } from 'react'

import { SiteFrame } from '@/components/site-frame'

/**
 * Stand-in for the app shell (sidebar / bottom tabs, MV-050). Until it lands, the logged-in
 * pages keep the marketing frame so the header and the attribution footer stay visible.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>
}
