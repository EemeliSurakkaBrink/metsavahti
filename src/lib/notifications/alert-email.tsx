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

import { hakkuutapaLabel } from '@/lib/wfs/hakkuutapa'

export type AlertEmailDeclaration = {
  declarationNumber: string
  hakkuutapa: number | null
  areaHa: number | null
  distanceM: number
  kind: 'new' | 'changed'
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
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f6f7f4' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: 24, borderRadius: 8 }}>
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
                {d.kind === 'changed' ? ' (muuttunut)' : ''}
              </Text>
            ))}
          </Section>
          <Button
            href={dashboardUrl}
            style={{
              backgroundColor: '#1f5f3a',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 6,
            }}
          >
            Avaa Metsävahti
          </Button>
          <Hr />
          <Text style={{ color: '#666', fontSize: 12 }}>{attribution}</Text>
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
