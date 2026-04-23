import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  // Force absolute dark mode for the entire app.
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return <Component {...pageProps} />
}
