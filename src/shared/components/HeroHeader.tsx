/**
 * Shared hero for the public dome — the only copy on this screen.
 * Italic editorial line with a Polvo Estelar → Ámbar text gradient.
 */
export function HeroHeader() {
  return (
    <header className="px-6 pt-12 pb-4 text-center">
      <h1 className="bg-gradient-to-r from-polvo-estelar to-ambar bg-clip-text font-editorial text-2xl font-medium italic tracking-wide text-transparent sm:text-3xl">
        Por más noches estrelladas admirando a mi Luna
      </h1>
    </header>
  )
}