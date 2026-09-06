import type { Metadata } from 'next'
import Link from 'next/link'

import { SystemPage, systemAction } from '@/components/system-page'

export const metadata: Metadata = { title: 'Huoltotauko', robots: { index: false } }

/**
 * Maintenance page (docs/design/App.dc.html#route=huolto). The middleware (MV-046) sends
 * every request here while `MAINTENANCE_MODE=1`, so "Yritä uudelleen" simply goes home.
 */
export default function MaintenancePage() {
  return (
    <SystemPage
      code="HUOLTO"
      title="Metsävahti on huoltotauolla"
      actions={
        <Link className={systemAction.primary} href="/">
          Yritä uudelleen
        </Link>
      }
    >
      Palaamme pian. Sähköposti-ilmoitukset lähetetään huollon jälkeen normaalisti.
    </SystemPage>
  )
}
