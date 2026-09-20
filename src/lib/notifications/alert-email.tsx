import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { render } from '@react-email/render'

import { colors, fontFamily, radius } from '@/lib/design-tokens'
import { hakkuutapaLabel } from '@/lib/wfs/hakkuutapa'
import type { AlertChangeType } from '@/payload/collections/Alerts'

const CHANGE_LABEL: Record<AlertChangeType, string> = {
  new: '',
  geometry_changed: ' (rajaus muuttunut)',
  attributes_changed: ' (tiedot muuttuneet)',
  removed: ' (poistunut aineistosta)',
}

export type AlertEmailDeclaration = {
  declarationNumber: string
  hakkuutapa: number | null
  areaHa: number | null
  distanceM: number
  changeType: AlertChangeType
}

export type AlertEmailProps = {
  watchAreaName: string
  declarations: AlertEmailDeclaration[]
  dashboardUrl: string
  attribution: string
}

export function AlertEmail({
  watchAreaName,
  declarations,
  dashboardUrl,
  attribution,
}: AlertEmailProps) {
  return (
    <Html lang="fi">
      <Head />
      <Preview>
        {`${declarations.length} uutta tai muuttunutta metsänkäyttöilmoitusta alueella ${watchAreaName}`}
      </Preview>
      <Body
        style={{
          fontFamily: fontFamily.sans,
          backgroundColor: colors.paper.DEFAULT,
          color: colors.ink.DEFAULT,
        }}
      >
        <Container
          style={{
            backgroundColor: colors.paper.raised,
            padding: 24,
            borderRadius: radius.xl,
            border: `1px solid ${colors.line.DEFAULT}`,
          }}
        >
          <Heading as="h2">Metsävahti: uusia ilmoituksia alueella {watchAreaName}</Heading>
          <Text>
            Vahtialueesi läheltä löytyi {declarations.length} metsänkäyttöilmoitusta, jotka ovat
            uusia tai muuttuneet edellisen tarkistuksen jälkeen.
          </Text>
          <Section>
            {declarations.map((d) => (
              <Text key={d.declarationNumber} data-testid="alert-declaration">
                <strong>{d.declarationNumber}</strong> · {hakkuutapaLabel(d.hakkuutapa)}
                {d.areaHa != null ? ` · ${d.areaHa.toFixed(2)} ha` : ''} · {Math.round(d.distanceM)}{' '}
                m vahtialueesta
                {CHANGE_LABEL[d.changeType]}
              </Text>
            ))}
          </Section>
          <Button
            href={dashboardUrl}
            style={{
              backgroundColor: colors.forest[700],
              color: colors.paper.raised,
              padding: '10px 16px',
              borderRadius: radius.lg,
            }}
          >
            Avaa Metsävahti
          </Button>
          <Hr />
          <Text style={{ color: colors.ink.muted, fontSize: 12 }}>{attribution}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderAlertEmail(
  props: AlertEmailProps,
): Promise<{ html: string; text: string }> {
  const element = <AlertEmail {...props} />
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])
  return { html, text }
}
