import { metsakeskusAttribution } from '@/lib/attribution'
import { env } from '@/lib/env'
import type { JobContext } from '@/lib/jobs/context'
import { type AlertEmailDeclaration, renderAlertEmail } from '@/lib/notifications/alert-email'
import type { Alert, Declaration, User, WatchArea } from '@/payload-types'

export type SendAlertsResult = { emailsSent: number; emailsFailed: number; alertsHandled: number }

type PopulatedAlert = Omit<Alert, 'user' | 'watchArea' | 'declaration'> & {
  user: User
  watchArea: WatchArea
  declaration: Declaration
}

function isPopulated(alert: Alert): alert is PopulatedAlert {
  return (
    typeof alert.user === 'object' &&
    typeof alert.watchArea === 'object' &&
    typeof alert.declaration === 'object'
  )
}

/**
 * Group pending alerts per (user, watch area), send one email per group,
 * mark alerts sent/failed and write a notification-log row.
 */
export async function sendAlerts(ctx: JobContext, jobRunId: string): Promise<SendAlertsResult> {
  const { payload, logger, now } = ctx
  const { docs } = await payload.find({
    collection: 'alerts',
    where: { status: { equals: 'pending' } },
    depth: 1,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })

  const groups = new Map<string, PopulatedAlert[]>()
  for (const alert of docs) {
    if (!isPopulated(alert)) continue
    if (!alert.watchArea.notificationsEnabled) continue
    const key = `${alert.user.id}:${alert.watchArea.id}`
    groups.set(key, [...(groups.get(key) ?? []), alert])
  }

  let emailsSent = 0
  let emailsFailed = 0
  let alertsHandled = 0

  for (const alerts of groups.values()) {
    const first = alerts[0]
    if (!first) continue
    const { user, watchArea } = first
    const declarations: AlertEmailDeclaration[] = alerts.map((a) => ({
      declarationNumber: a.declaration.declarationNumber,
      hakkuutapa: a.declaration.hakkuutapa ?? null,
      areaHa: a.declaration.areaHa ?? null,
      distanceM: a.distanceM ?? 0,
      kind: a.kind,
    }))

    const { html, text } = await renderAlertEmail({
      watchAreaName: watchArea.name,
      declarations,
      dashboardUrl: `${env.NEXT_PUBLIC_SERVER_URL}/dashboard`,
      attribution: metsakeskusAttribution(now()),
    })

    let status: 'sent' | 'failed' = 'sent'
    let error: string | undefined
    try {
      await payload.sendEmail({
        to: user.email,
        subject: `Metsävahti: ${declarations.length} ilmoitusta alueella ${watchArea.name}`,
        html,
        text,
      })
      emailsSent += 1
    } catch (err) {
      status = 'failed'
      error = err instanceof Error ? err.message : String(err)
      emailsFailed += 1
      logger.error({ err, userId: user.id, watchAreaId: watchArea.id }, 'alert email failed')
    }

    const sentAt = now().toISOString()
    for (const alert of alerts) {
      await payload.update({
        collection: 'alerts',
        id: alert.id,
        data: { status, ...(status === 'sent' ? { sentAt } : {}) },
        overrideAccess: true,
      })
      alertsHandled += 1
    }
    await payload.create({
      collection: 'notification-log',
      data: {
        alerts: alerts.map((a) => a.id),
        user: user.id,
        recipient: user.email,
        channel: 'email',
        status,
        error,
        jobRunId,
      },
      overrideAccess: true,
    })
  }

  const result = { emailsSent, emailsFailed, alertsHandled }
  logger.info(result, 'send-alerts done')
  return result
}
