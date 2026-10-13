import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles/app.css?url'

/*
 * Theme engine — docs/UX_UX_Spec.md §2A / docs/ROADMAP.md §1.2.
 *
 * Dark is the authored default (the `dark` class below), but the resolved theme
 * is: stored choice -> OS preference -> dark. This must run BLOCKING in <head>
 * before hydration, otherwise the first paint flashes the wrong theme (FOUC).
 * `head().scripts` renders a plain <script nonce> with no async/defer, so it
 * executes during parsing — that is what makes it FOUC-safe.
 */
const THEME_INIT_SCRIPT = `(function(){try{var stored=localStorage.getItem('theme');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=stored?stored==='dark':prefersDark;var root=document.documentElement;root.classList.toggle('dark',isDark);root.style.colorScheme=isDark?'dark':'light';}catch(error){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap',
      },
    ],
    scripts: [
      {
        children: THEME_INIT_SCRIPT,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script above mutates this element
    // before React hydrates, so the server and client markup differ by design.
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
