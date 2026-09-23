function Svg({ children, ...props }) {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function PayLogo({ id }) {
  switch (id) {
    case 'telegram':
      return (
        <Svg>
          <circle cx="24" cy="24" r="24" fill="#229ED9" />
          <path fill="#fff" d="M34.6 14.3 11.9 23c-1.6.6-1.6 1.5-.3 1.9l5.8 1.8 13.5-8.5c.6-.4 1.2-.2.7.2l-10.9 9.9-.4 6.1c.6 0 .9-.3 1.2-.6l3-2.9 6.2 4.6c1.1.6 1.9.3 2.2-1.1l4-18.8c.4-1.7-.6-2.5-1.7-2z" />
        </Svg>
      )
    case 'upi':
      return (
        <Svg>
          <rect width="48" height="48" rx="12" fill="#fff" />
          <path fill="#F7931A" d="M10 12h8v24h-8z" />
          <path fill="#097939" d="M20 12h8v24h-8z" />
          <path fill="#3B2E8C" d="M30 12h8v24h-8z" />
          <text x="24" y="30" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0B1B3A" fontFamily="Arial, sans-serif">UPI</text>
        </Svg>
      )
    case 'paytm':
      return (
        <Svg>
          <rect width="48" height="48" rx="12" fill="#00BAF2" />
          <text x="24" y="30" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">paytm</text>
        </Svg>
      )
    case 'phonepe':
      return (
        <Svg>
          <rect width="48" height="48" rx="12" fill="#5F259F" />
          <circle cx="24" cy="22" r="9" fill="#fff" />
          <path fill="#5F259F" d="M21 17.5c2.6 0 4.4 1.4 4.4 3.4 0 1.5-1 2.5-2.4 3l2.7 4.6h-2.5l-2.4-4.2H21.6V28.5H20v-11h1zm1.5 1.6v3.4h.5c1.2 0 2-.6 2-1.7s-.8-1.7-2-1.7h-.5z" />
        </Svg>
      )
    case 'netbanking':
      return (
        <Svg>
          <rect width="48" height="48" rx="12" fill="#1A4F9C" />
          <path fill="#F4C430" d="M8 20 24 10l16 10v3H8z" />
          <path fill="#fff" d="M12 24h6v10h-6zm9 0h6v10h-6zm9 0h6v10h-6z" />
          <path fill="#DCE8F8" d="M10 35h28v3H10z" />
        </Svg>
      )
    case 'card':
      return (
        <Svg>
          <rect width="48" height="48" rx="12" fill="#1A1F71" />
          <rect x="8" y="14" width="32" height="20" rx="3" fill="#F7F7F7" />
          <rect x="8" y="18" width="32" height="5" fill="#F79E1B" />
          <circle cx="28" cy="29" r="4" fill="#EB001B" />
          <circle cx="33" cy="29" r="4" fill="#F79E1B" opacity=".92" />
        </Svg>
      )
    case 'usdt':
      return (
        <Svg>
          <circle cx="24" cy="24" r="24" fill="#26A17B" />
          <path fill="#fff" d="M21.2 14h5.6v4.2h4.7v3.8H26.8v2.3c4.7.2 8 1.5 8 3.9 0 2.7-4.2 4.5-10.8 4.5S13.2 30.9 13.2 28.2c0-2.4 3.3-3.7 8-3.9v-2.3h-6.8V18.2h6.8zm2.8 12.8c-3.8 0-6.3.8-6.3 1.8s2.5 1.8 6.3 1.8 6.3-.8 6.3-1.8-2.5-1.8-6.3-1.8z" />
        </Svg>
      )
    case 'btc':
      return (
        <Svg>
          <circle cx="24" cy="24" r="24" fill="#F7931A" />
          <path fill="#fff" d="M27.6 21.6c.5-3.3-2-5-5.5-6.2l1.1-4.5-2.7-.7-1.1 4.3c-.7-.2-1.4-.3-2.2-.5l1.1-4.3-2.7-.7-1.1 4.5c-.6-.1-1.1-.3-1.7-.4l.1-.3-2.7-.7-.5 2.2s2 .5 2 .5c.8.2.9.7.9 1.1l-1 3.9c.1 0 .3.1.4.1h-.4l-1.4 5.5c-.1.3-.4.7-.9.6 0 0-2-.5-2-.5l-1.1 2.5 2.6.6c.5.1 1 .3 1.5.4L13.6 35l2.7.7 1.1-4.5c.7.2 1.4.4 2.1.5l-1.1 4.4 2.7.7 1.1-4.5c4.6.9 8 0.5 9.5-3.6 1.2-3.3-.1-5.2-2.5-6.4 1.8-.4 3.1-1.6 3.5-4.1zM23.6 29c-1.9 3.3-6.3 1.8-7.6 1.2l1.4-5.4c1.3.3 5.8 1.1 6.2 4.2zm.4-7.7c-1.7 3-5.7 1.6-6.9 1.2l1.2-4.9c1.2.3 5.2 1 5.7 3.7z" />
        </Svg>
      )
    case 'eth':
      return (
        <Svg>
          <circle cx="24" cy="24" r="24" fill="#627EEA" />
          <path fill="#fff" fillOpacity=".8" d="M24 8l-.3.9v19.3L24 29.4 35.2 23z" />
          <path fill="#fff" d="M24 8 12.8 23 24 29.4z" />
          <path fill="#fff" fillOpacity=".8" d="M24 31.2l-.2.2v8.3l.2.6L35.2 25z" />
          <path fill="#fff" d="M24 40.3V31.2L12.8 25z" />
        </Svg>
      )
    default:
      return null
  }
}
