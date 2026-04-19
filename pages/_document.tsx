import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  // Apply dark mode by default on initial render to minimize FOUC
  return (
    <Html className="dark" lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
