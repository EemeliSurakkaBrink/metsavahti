import Link from 'next/link'

/**
 * Marketing header (docs/design/Landing.dc.html#header-footer): logo, section links, login
 * and the "Luo tili" pill. The app variant with the account menu arrives with MV-050.
 *
 * "Kirjaudu" points at the existing `/login` route until MV-041 moves it to `/kirjaudu`;
 * the other targets are the spec routes their tickets create (03-pages.md).
 */
const navLinks = [
  { href: '/miten-se-toimii', label: 'Miten se toimii' },
  { href: '/hinnoittelu', label: 'Hinnoittelu' },
  { href: '/login', label: 'Kirjaudu' },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-5 py-3.5">
        <Link
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-forest-700"
          href="/"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-7 items-center justify-center rounded-md bg-forest-700"
          >
            <span className="block size-2.5 rounded-full bg-amber-300" />
          </span>
          Metsävahti
        </Link>
        <nav aria-label="Päävalikko" className="ml-auto">
          <ul className="flex flex-wrap items-center gap-5 text-base font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link className="text-ink hover:text-forest-700 hover:underline" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                className="inline-flex items-center rounded-full bg-forest-700 px-4.5 py-2.5 font-semibold text-white transition-colors hover:bg-forest-600"
                href="/rekisteroidy"
              >
                Luo tili
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
