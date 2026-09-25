import { useId } from 'react'

const iconThemes = {
  '2048': ['#ffcf70', '#e77237'],
  aim: ['#ff7979', '#9d3ad6'],
  blob: ['#84f3b6', '#326ec8'],
  bubble: ['#7eeaff', '#9562e8'],
  carrom: ['#eec489', '#8a4c29'],
  chess: ['#d8c7ff', '#6746ae'],
  crossword: ['#a1f0ca', '#297a8a'],
  draw: ['#ffc486', '#f06b80'],
  runner: ['#ffe076', '#e46065'],
  knowledge: ['#8fdaff', '#4270c5'],
  city: ['#ffd783', '#ec7864'],
  jigsaw: ['#d59cff', '#6954d6'],
  kite: ['#a0f8ef', '#3c8bd0'],
  lantern: ['#ffe38b', '#d37a42'],
  ludo: ['#fdd479', '#447cd2'],
  rooms: ['#a0f6c5', '#7468da'],
  rummy: ['#ffe19a', '#c45b75'],
}

export function getGameIconKind(game) {
  const name = `${game.name || ''} ${game.id || ''}`.toLowerCase()
  if (/2048/.test(name)) return '2048'
  if (/aim trainer/.test(name)) return 'aim'
  if (/blob/.test(name)) return 'blob'
  if (/bubble/.test(name)) return 'bubble'
  if (/carrom/.test(name)) return 'carrom'
  if (/chess/.test(name)) return 'chess'
  if (/crossword/.test(name)) return 'crossword'
  if (/draw.*guess/.test(name)) return 'draw'
  if (/runner/.test(name)) return 'runner'
  if (/general knowledge|trivia|quiz/.test(name)) return 'knowledge'
  if (/idle city|city/.test(name)) return 'city'
  if (/jigsaw|puzzle/.test(name)) return 'jigsaw'
  if (/kite/.test(name)) return 'kite'
  if (/lantern/.test(name)) return 'lantern'
  if (/multiplayer ludo|ludo rooms/.test(name)) return 'rooms'
  if (/ludo/.test(name)) return 'ludo'
  if (/rummy/.test(name)) return 'rummy'
  return null
}

function IconSubject({ kind }) {
  switch (kind) {
    case '2048':
      return <g fontFamily="Arial, sans-serif" fontWeight="900" textAnchor="middle">
        {[[23, 23, '2', '#ffe7a4'], [52, 23, '0', '#ffc979'], [23, 52, '4', '#ffaf64'], [52, 52, '8', '#ff8355']].map(([x, y, value, fill]) => <g key={`${x}-${y}`}><rect x={x} y={y} width="25" height="25" rx="5" fill={fill} /><text x={x + 12.5} y={y + 18} fill="#58381d" fontSize="17">{value}</text></g>)}
      </g>
    case 'aim':
      return <g fill="none" stroke="#fff" strokeWidth="3"><circle cx="50" cy="50" r="26" /><circle cx="50" cy="50" r="17" stroke="#ffd973" /><circle cx="50" cy="50" r="7" fill="#ff6479" stroke="none" /><path d="M50 12v17M50 71v17M12 50h17M71 50h17" strokeLinecap="round" /></g>
    case 'blob':
      return <g><path d="M23 59c-5-15 6-30 21-28 9-9 26-2 26 10 12 5 13 24 3 30-17 12-45 8-50-12Z" fill="#78e6a8" stroke="#d3ffe2" strokeWidth="3" /><circle cx="42" cy="52" r="3" fill="#153c49" /><circle cx="58" cy="52" r="3" fill="#153c49" /><path d="M43 62q7 7 14 0" fill="none" stroke="#153c49" strokeWidth="2.5" strokeLinecap="round" /><circle cx="76" cy="30" r="10" fill="#a57bff" stroke="#e7d9ff" strokeWidth="2" /></g>
    case 'bubble':
      return <g stroke="#fff" strokeOpacity=".72" strokeWidth="2"><circle cx="50" cy="28" r="12" fill="#ff8bb8" /><circle cx="34" cy="47" r="12" fill="#78e8fa" /><circle cx="66" cy="47" r="12" fill="#ffd774" /><circle cx="50" cy="65" r="12" fill="#a19bff" /><path d="m46 87 4-11 4 11" fill="#fff" stroke="none" /></g>
    case 'carrom':
      return <g><rect x="19" y="19" width="62" height="62" rx="7" fill="#e9b979" stroke="#fff1c5" strokeWidth="4" /><rect x="28" y="28" width="44" height="44" rx="3" fill="#a76a3b" stroke="#704027" strokeWidth="2" />{[[30,30],[70,30],[30,70],[70,70]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#382c2b" />)}<circle cx="50" cy="50" r="13" fill="none" stroke="#ffe1a2" strokeWidth="2" /><circle cx="50" cy="50" r="8" fill="#fff4d6" /><circle cx="61" cy="44" r="4" fill="#bd333a" /></g>
    case 'chess':
      return <g fill="#f2e8ff" stroke="#4a3477" strokeWidth="2"><path d="M35 75h30l-4-9H39zM40 63h20l-3-25H43zM39 33h22v10H39zM39 33V22h7v7h8v-7h7v11" /><path d="M32 78h36v7H32z" fill="#c6a9f4" /></g>
    case 'crossword':
      return <g fontFamily="Arial, sans-serif" fontWeight="800" textAnchor="middle"><rect x="19" y="19" width="62" height="62" rx="5" fill="#173d49" stroke="#baf9db" strokeWidth="2" />{[[24,24,'C'],[44,24,'A'],[64,24,'T'],[44,44,'R'],[44,64,'T']].map(([x,y,s])=><g key={`${x}-${y}`}><rect x={x} y={y} width="18" height="18" rx="2" fill="#d7fff0" /><text x={x+9} y={y+14} fontSize="13" fill="#235c5a">{s}</text></g>)}</g>
    case 'draw':
      return <g><path d="M31 25c-17 8-20 32-6 46 14 15 34 12 43-1 3-5-1-12-7-11-7 1-10-4-8-10 4-9 17-7 22-15-8-13-27-18-44-9Z" fill="#ffe0ae" stroke="#fff" strokeWidth="2" />{[[31,40,'#ff6b7a'],[49,32,'#58c8f5'],[66,40,'#9a79f2'],[35,61,'#71d79a']].map(([x,y,c])=><circle key={x} cx={x} cy={y} r="5" fill={c} />)}<path d="m67 70 17-26 5 4-17 26-11 7z" fill="#99623f" stroke="#fff5e6" strokeWidth="2" /></g>
    case 'runner':
      return <g fill="none" stroke="#fff0c7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><circle cx="56" cy="25" r="7" fill="#fff0c7" stroke="none" /><path d="m48 40 12 11-12 13M48 40l-13 9-13-3M60 51l15-1 7 11M48 64 31 78M31 78l-12 3M48 64l10 13 15 2" /><path d="M18 68h14M11 58h15" stroke="#ffe07b" strokeWidth="3" /></g>
    case 'knowledge':
      return <g><path d="M16 31q17-9 34 0v46q-17-9-34 0zM50 31q17-9 34 0v46q-17-9-34 0z" fill="#e6f4ff" stroke="#4c7ac0" strokeWidth="3" /><path d="M50 31v46" stroke="#4c7ac0" strokeWidth="3" /><text x="50" y="62" textAnchor="middle" fill="#3d68a8" fontSize="37" fontFamily="Arial, sans-serif" fontWeight="900">?</text></g>
    case 'city':
      return <g fill="#fff2d6"><path d="M19 77V42h17v35M39 77V24h23v53M65 77V36h18v41" stroke="#fff6df" strokeWidth="2" />{[[25,49],[25,61],[45,32],[54,32],[45,44],[54,44],[45,56],[54,56],[71,45],[71,58]].map(([x,y])=><rect key={`${x}-${y}`} x={x} y={y} width="5" height="6" rx="1" fill="#ffbd6e" />)}<path d="M13 79h75" stroke="#ffd882" strokeWidth="3" /></g>
    case 'jigsaw':
      return <g><path d="M27 26h18c-1 8 3 11 8 11s9-3 8-11h13v21c-8-1-11 3-11 8s3 9 11 8v12H54c1-8-3-11-8-11s-9 3-8 11H27V55c8 1 11-3 11-8s-3-9-11-8z" fill="#d9b5ff" stroke="#fff0ff" strokeWidth="2.5" strokeLinejoin="round" /></g>
    case 'kite':
      return <g><path d="m51 16 27 31-27 31-27-31z" fill="#8ff1ec" stroke="#e9ffff" strokeWidth="3" /><path d="M51 16v62M24 47h54" stroke="#3f9fc9" strokeWidth="2" /><path d="M51 78q-12 8-7 16m0 0 7-5m-7 5-7-3" fill="none" stroke="#eaffff" strokeWidth="2" /></g>
    case 'lantern':
      return <g><path d="M50 16v11M41 26h18M37 32q13-13 26 0l6 31q-19 16-38 0z" fill="#f7b95e" stroke="#fff0bd" strokeWidth="3" /><path d="M39 41h22l-4 21H43z" fill="#fff3b0" /><path d="M34 71h32M42 77h16" stroke="#ffe6a6" strokeWidth="4" strokeLinecap="round" /><circle cx="50" cy="50" r="9" fill="#fffbd3" /></g>
    case 'ludo':
      return <g><rect x="18" y="18" width="64" height="64" rx="8" fill="#fff6db" stroke="#fff" strokeWidth="2" /><path d="M50 19v62M19 50h62" stroke="#435475" strokeWidth="3" /><rect x="23" y="23" width="22" height="22" rx="3" fill="#f56b70" /><rect x="55" y="23" width="22" height="22" rx="3" fill="#72cafa" /><rect x="23" y="55" width="22" height="22" rx="3" fill="#f3cb62" /><rect x="55" y="55" width="22" height="22" rx="3" fill="#79da98" /><circle cx="50" cy="50" r="8" fill="#fff" /></g>
    case 'rooms':
      return <g><rect x="18" y="21" width="64" height="58" rx="10" fill="#243b65" stroke="#dbfff2" strokeWidth="3" />{[[36,39,'#ff777d'],[64,39,'#7ccfff'],[36,62,'#ffda72'],[64,62,'#81e3a8']].map(([x,y,c])=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="9" fill={c} /><circle cx={x-2} cy={y-2} r="3" fill="#fff" opacity=".65" /></g>)}</g>
    case 'rummy':
      return <g><rect x="20" y="25" width="37" height="52" rx="5" fill="#fff6e9" stroke="#724451" strokeWidth="2" transform="rotate(-17 38 51)" /><rect x="44" y="25" width="37" height="52" rx="5" fill="#fff6e9" stroke="#724451" strokeWidth="2" transform="rotate(17 62 51)" /><rect x="33" y="24" width="35" height="54" rx="5" fill="#fff" stroke="#724451" strokeWidth="2" /><text x="50" y="59" textAnchor="middle" fill="#df536a" fontSize="34">♥</text></g>
    default:
      return null
  }
}

export default function GameIcon({ game, kind, tile = false }) {
  const [light, dark] = iconThemes[kind]
  const gradient = useId().replaceAll(':', '')
  return <svg className={`game-icon${tile ? ' game-icon-tile' : ''}`} x={tile ? 44 : undefined} y={tile ? 17 : undefined} viewBox="0 0 100 100" role="img" aria-label={`${game.name} icon`}>
    <defs><radialGradient id={gradient} cx="30%" cy="23%" r="90%"><stop stopColor={light} /><stop offset=".62" stopColor={dark} /><stop offset="1" stopColor="#142032" /></radialGradient></defs>
    <circle cx="50" cy="50" r="49" fill={`url(#${gradient})`} />
    <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeOpacity=".34" strokeWidth="1.5" />
    <circle cx="26" cy="16" r="3" fill="#fff" opacity=".65" />
    <circle cx="81" cy="70" r="2" fill="#fff" opacity=".48" />
    <IconSubject kind={kind} />
  </svg>
}
