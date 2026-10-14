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
 * true di perangkat warga sungguhan: layar sempit, ATAU layar sentuh (tablet)
 * berapa pun lebarnya — warga dengan tablet tidak boleh melihat bingkai HP &
 * status-bar palsu. Mock-up bingkai HP + Panel Demo hanya untuk peninjau di
 * layar lebar bermouse.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px), (pointer: coarse)')
}
