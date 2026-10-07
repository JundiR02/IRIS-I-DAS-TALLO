import { useEffect, useState } from 'react'

/** Berlangganan sebuah media query, reaktif terhadap perubahan ukuran layar/rotasi. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * true di HP sungguhan (layar sempit). Di bawah breakpoint ini aplikasi
 * tampil penuh-layar seperti web-app biasa; di atasnya (tablet/desktop
 * peninjau) dibungkus mock-up bingkai HP + Panel Demo untuk kebutuhan review.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
