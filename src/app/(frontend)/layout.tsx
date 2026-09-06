import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import Link from 'next/link'
import React from 'react'

import '@/app/globals.css'
import { Attribution } from '@/components/attribution'

/** Design typeface (docs/design/README.md); exposed as --font-figtree for the Tailwind theme. */
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Metsävahti', template: '%s · Metsävahti' },
  description:
    'Metsävahti seuraa Metsäkeskuksen metsänkäyttöilmoituksia valitsemasi alueen ympärillä ja ilmoittaa uusista tai muuttuneista ilmoituksista.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={figtree.variable} lang="fi">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <header className="border-b">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link className="font-semibold" href="/">
              Metsävahti
            </Link>
            <ul className="flex gap-4 text-sm">
              <li>
                <Link href="/dashboard">Vahtialueet</Link>
              </li>
              <li>
                <Link href="/login">Kirjaudu</Link>
              </li>
              <li>
                <Link href="/admin">Ylläpito</Link>
              </li>
            </ul>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <Attribution />
          </div>
        </footer>
      </body>
    </html>
  )
}
