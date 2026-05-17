// SVG placeholder screenshots for HomeDock UI pages
// All inlined — no external image dependencies

export function HomePlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="homeBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f5f7"/>
          <stop offset="100%" stopColor="#e8e8ed"/>
        </linearGradient>
        <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#006644"/>
          <stop offset="100%" stopColor="#00855a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#homeBg)"/>
      {/* Header */}
      <rect x="0" y="0" width="800" height="48" fill="#ffffff" opacity="0.9"/>
      <text x="40" y="30" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#1d1d1f">HomeDock</text>
      <circle cx="760" cy="24" r="12" fill="#006644"/>
      {/* Nav pills */}
      <rect x="160" y="14" width="44" height="20" rx="10" fill="#f0f0f0"/>
      <text x="182" y="28" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#6e6e73">Home</text>
      <rect x="214" y="14" width="44" height="20" rx="10" fill="#f0f0f0"/>
      <text x="236" y="28" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#6e6e73">Wall</text>
      <rect x="268" y="14" width="44" height="20" rx="10" fill="#f0f0f0"/>
      <text x="290" y="28" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#6e6e73">Echo</text>
      <rect x="322" y="14" width="60" height="20" rx="10" fill="#f0f0f0"/>
      <text x="340" y="28" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#6e6e73">Archive</text>
      <rect x="392" y="14" width="44" height="20" rx="10" fill="#f0f0f0"/>
      <text x="407" y="28" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#6e6e73">Todo</text>
      {/* Hero area */}
      <rect x="40" y="72" width="340" height="160" rx="16" fill="#ffffff" stroke="#e8e8ed" strokeWidth="1"/>
      <text x="60" y="106" fontFamily="-apple-system, sans-serif" fontSize="11" fill="#006644" fontWeight="600">RETURNED</text>
      <rect x="60" y="120" width="180" height="14" rx="7" fill="#1d1d1f"/>
      <rect x="60" y="144" width="240" height="10" rx="5" fill="#d2d2d7"/>
      <rect x="60" y="162" width="200" height="10" rx="5" fill="#d2d2d7"/>
      <rect x="60" y="198" width="80" height="24" rx="12" fill="#006644"/>
      <text x="76" y="214" fontFamily="-apple-system, sans-serif" fontSize="11" fill="#ffffff" fontWeight="600">Wall</text>
      {/* Stats row */}
      <rect x="40" y="252" width="105" height="72" rx="12" fill="#ffffff" stroke="#e8e8ed" strokeWidth="1"/>
      <text x="60" y="282" fontFamily="-apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#1d1d1f">12</text>
      <text x="60" y="300" fontFamily="-apple-system, sans-serif" fontSize="11" fill="#a1a1a6">Capsules</text>
      <rect x="155" y="252" width="105" height="72" rx="12" fill="#ffffff" stroke="#e8e8ed" strokeWidth="1"/>
      <text x="175" y="282" fontFamily="-apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#1d1d1f">4</text>
      <text x="175" y="300" fontFamily="-apple-system, sans-serif" fontSize="11" fill="#a1a1a6">Archived</text>
      <rect x="270" y="252" width="105" height="72" rx="12" fill="#ffffff" stroke="#e8e8ed" strokeWidth="1"/>
      <text x="290" y="282" fontFamily="-apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#1d1d1f">2</text>
      <text x="290" y="300" fontFamily="-apple-system, sans-serif" fontSize="11" fill="#a1a1a6">Echoing</text>
      {/* Base map preview */}
      <rect x="40" y="340" width="340" height="130" rx="16" fill="#ffffff" stroke="#e8e8ed" strokeWidth="1"/>
      <text x="56" y="366" fontFamily="-apple-system, sans-serif" fontSize="11" fontWeight="700" fill="#1d1d1f">Base Map</text>
      {/* Map dots */}
      {[[80,410],[130,395],[180,420],[230,400],[280,415],[320,405],[120,435],[200,440],[260,430],[300,425]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="6" fill="#006644" opacity={0.4+i*0.06}/>
      ))}
      <text x="56" y="456" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#a1a1a6">Content Distribution</text>
      {/* Right panel */}
      <rect x="400" y="72" width="360" height="398" rx="16" fill="#ffffff" stroke="#e8e8ed" strokeWidth="1"/>
      <text x="420" y="106" fontFamily="-apple-system, sans-serif" fontSize="13" fontWeight="700" fill="#1d1d1f">Fragment Wall</text>
      <rect x="420" y="120" width="320" height="1" fill="#e8e8ed"/>
      {[0,1,2,3,4].map(i=>(
        <g key={i}>
          <rect x="420" y={132+i*72} width={i%2===0?180:140} height={14} rx="7" fill="#f0f0f0"/>
          <rect x="420" y={152+i*72} width={i%2===0?240:200} height={10} rx="5" fill="#d2d2d7"/>
          <rect x="420" y={168+i*72} width={160} height={10} rx="5" fill="#e8e8ed"/>
        </g>
      ))}
      <text x="700" y="470" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function EchoPlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="echoBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f5f7"/>
          <stop offset="100%" stopColor="#e8e8ed"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#echoBg)"/>
      <rect x="0" y="0" width="400" height="48" fill="#ffffff" opacity="0.9"/>
      <text x="20" y="30" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#1d1d1f">Echo</text>
      <rect x="20" y="64" width="360" height="200" rx="16" fill="#ffffff" stroke="#e8e8ed"/>
      {/* Echo visual */}
      {[80,120,160].map((r,i)=>(
        <circle key={i} cx="200" cy="160" r={r} fill="none" stroke="#006644" strokeWidth="2" opacity={0.3-i*0.08}/>
      ))}
      <circle cx="200" cy="160" r="20" fill="#006644" opacity="0.7"/>
      <rect x="140" y="200" width="120" height="36" rx="18" fill="#006644"/>
      <text x="168" y="223" fontFamily="-apple-system, sans-serif" fontSize="12" fill="#ffffff" fontWeight="600">Play Echo</text>
      <text x="20" y="280" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function WallPlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="300" fill="#f5f5f7"/>
      <rect x="0" y="0" width="400" height="48" fill="#ffffff" opacity="0.9"/>
      <text x="20" y="30" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#1d1d1f">Fragment Wall</text>
      {/* Masonry layout */}
      {[
        [20,64,120,140],[150,64,100,120],[260,64,120,160],[20,214,90,66],
        [120,194,110,86],[240,234,80,66],[330,64,50,136],[330,210,50,70]
      ].map(([x,y,w,h],i)=>(
        <rect key={i} x={x} y={y} width={w} height={h} rx="12" fill="#ffffff" stroke="#e8e8ed" opacity={0.6+i*0.05}/>
      ))}
      {/* Content lines */}
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x={30+i*35} y={76+i*36} width={80-i*8} height={10} rx="5" fill="#d2d2d7"/>
          <rect x={30+i*35} y={92+i*36} width={60-i*4} height={8} rx="4" fill="#e8e8ed"/>
        </g>
      ))}
      <text x="20" y="285" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function ArchivePlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="300" fill="#f5f5f7"/>
      <rect x="0" y="0" width="400" height="48" fill="#ffffff" opacity="0.9"/>
      <text x="20" y="30" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#1d1d1f">Archive Vault</text>
      {/* Folder icon */}
      <rect x="170" y="90" width="60" height="50" rx="6" fill="#006644" opacity="0.8"/>
      <rect x="175" y="80" width="50" height="16" rx="4" fill="#006644"/>
      {[0,1,2,3].map(i=>(
        <rect key={i} x="40" y={64+i*52} width="320" height="44" rx="10" fill="#ffffff" stroke="#e8e8ed"/>
      ))}
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x="56" y={76+i*52} width="90" height="10" rx="5" fill="#d2d2d7"/>
          <rect x="56" y={92+i*52} width="160" height={i%2===0?8:6} rx="4" fill="#e8e8ed"/>
          <rect x="310" y={80+i*52} width="36" height="20" rx="10" fill={i===1?"#006644":"#f0f0f0"} opacity={i===1?1:0.6}/>
        </g>
      ))}
      <text x="20" y="285" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function TodoPlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="400" height="300" fill="#f5f5f7"/>
      <rect x="0" y="0" width="400" height="48" fill="#ffffff" opacity="0.9"/>
      <text x="20" y="30" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#1d1d1f">Todos</text>
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x="20" y={60+i*54} width="360" height="46" rx="12" fill="#ffffff" stroke={i===1?"#006644":"#e8e8ed"} strokeWidth={i===1?2:1}/>
          <rect x="36" y={74+i*54} width={i===1?0:14} height={i===1?0:14} rx="7" fill={i%2===0?"none":"#006644"} stroke="#d2d2d7"/>
          {i%2===0 && <rect x="60" y={77+i*54} width={180-i*20} height={10} rx="5" fill="#d2d2d7"/>}
          {i%2!==0 && <rect x="60" y={77+i*54} width={140} height={10} rx="5" fill="#1d1d1f"/>}
          <rect x="300" y={72+i*54} width="64" height="18" rx="9" fill={i%3===0?"rgba(0,102,68,0.1)":"#f0f0f0"}/>
          <text x="314" y={84+i*54} fontFamily="-apple-system, sans-serif" fontSize="9" fill="#006644" fontWeight="600">
            {i%3===0?"High":i%3===1?"Med":"Low"}
          </text>
        </g>
      ))}
      <text x="20" y="285" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function NightPlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="800" height="500" fill="#0d0f14"/>
      {/* Night mode UI */}
      <rect x="0" y="0" width="800" height="48" fill="#13161e" opacity="0.95"/>
      <text x="40" y="30" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#f1f3f5">HomeDock</text>
      <circle cx="760" cy="24" r="12" fill="#10b978" opacity="0.9"/>
      <rect x="40" y="70" width="360" height="180" rx="18" fill="#13161e" stroke="#222736"/>
      <text x="60" y="104" fontFamily="-apple-system, sans-serif" fontSize="11" fill="#10b978" fontWeight="600">NIGHT MODE</text>
      <rect x="60" y="118" width="200" height="14" rx="7" fill="#f1f3f5"/>
      <rect x="60" y="142" width="280" height="10" rx="5" fill="#3f4555"/>
      <rect x="60" y="160" width="240" height="10" rx="5" fill="#3f4555"/>
      <rect x="60" y="178" width="200" height="10" rx="5" fill="#3f4555"/>
      <rect x="60" y="210" width="80" height="28" rx="14" fill="#10b978" opacity="0.15"/>
      <text x="72" y="228" fontFamily="-apple-system, sans-serif" fontSize="11" fill="#10b978" fontWeight="600">Wall</text>
      {/* Dark cards */}
      {[0,1,2].map(i=>(
        <rect key={i} x={40+i*130} y="272" width="115" height="70" rx="14" fill="#13161e" stroke="#222736"/>
      ))}
      {[0,1,2].map(i=>(
        <g key={i}>
          <text x={60+i*130} y={302} fontFamily="-apple-system, sans-serif" fontSize={i===0?"22":"20"} fontWeight="700" fill="#f1f3f5">{[12,8,5][i]}</text>
          <text x={60+i*130} y={324} fontFamily="-apple-system, sans-serif" fontSize="11" fill="#6b7280">{["Capsules","Archived","Echo"][i]}</text>
        </g>
      ))}
      <rect x="420" y="70" width="340" height="390" rx="18" fill="#13161e" stroke="#222736"/>
      <text x="440" y="104" fontFamily="-apple-system, sans-serif" fontSize="13" fontWeight="700" fill="#f1f3f5">Fragment Wall</text>
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x="440" y={124+i*80} width={i%2===0?180:140} height={60} rx="12" fill="#1a1e28" stroke="#222736"/>
          <rect x="456" y={140+i*80} width={i%2===0?100:80} height={10} rx="5" fill="#3f4555"/>
          <rect x="456" y={158+i*80} width={i%2===0?140:110} height={8} rx="4" fill="#2a2e3a"/>
        </g>
      ))}
      <text x="700" y="485" fontFamily="-apple-system, sans-serif" fontSize="10" fill="#3f4555">{label}</text>
    </svg>
  )
}

export function PhoneHomePlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 280 560" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="phoneBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f5f7"/>
          <stop offset="100%" stopColor="#e8e8ed"/>
        </linearGradient>
      </defs>
      <rect width="280" height="560" rx="36" fill="url(#phoneBg)"/>
      <rect x="12" y="12" width="256" height="536" rx="28" fill="#ffffff"/>
      {/* Dynamic Island */}
      <rect x="100" y="18" width="80" height="24" rx="12" fill="#0d0f14"/>
      {/* Status bar */}
      <text x="24" y="38" fontFamily="-apple-system, sans-serif" fontSize="11" fontWeight="600" fill="#1d1d1f">9:41</text>
      <circle cx="248" cy="32" r="8" fill="none" stroke="#1d1d1f" strokeWidth="1.5"/>
      <rect x="232" y="29" width="14" height="8" rx="2" fill="#1d1d1f"/>
      {/* Nav */}
      <rect x="16" y="52" width="248" height="36" rx="18" fill="#f0f0f0"/>
      <text x="32" y="74" fontFamily="-apple-system, sans-serif" fontSize="13" fontWeight="700" fill="#1d1d1f">HomeDock</text>
      <circle cx="246" cy="70" r="12" fill="#006644"/>
      {/* Capsule cards */}
      {[0,1,2].map(i=>(
        <g key={i}>
          <rect x="16" y={104+i*120} width="248" height="100" rx="16" fill="#ffffff" stroke="#e8e8ed" strokeWidth="1"/>
          <rect x="32" y={120+i*120} width="40" height="40" rx="10" fill="#006644" opacity="0.1"/>
          <rect x="84" y={124+i*120} width={i%2===0?120:90} height="12" rx="6" fill="#d2d2d7"/>
          <rect x="84" y={144+i*120} width={i%2===0?160:130} height={8} rx="4" fill="#e8e8ed"/>
          <rect x="32" y={170+i*120} width="56" height="20" rx="10" fill="#006644" opacity="0.8"/>
        </g>
      ))}
      {/* Bottom nav */}
      <rect x="0" y="490" width="280" height="70" rx="28" fill="#ffffff"/>
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x={32+i*60} y={506} width="24" height="24" rx="6" fill="#f0f0f0"/>
          <text x={36+i*60} y={534} fontFamily="-apple-system, sans-serif" fontSize="8" fill="#a1a1a6">{["Home","Wall","Add","Todo"][i]}</text>
        </g>
      ))}
      <text x="100" y="555" fontFamily="-apple-system, sans-serif" fontSize="9" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function PhoneSubmitPlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 280 560" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="280" height="560" rx="36" fill="#f5f5f7"/>
      <rect x="12" y="12" width="256" height="536" rx="28" fill="#ffffff"/>
      <rect x="100" y="18" width="80" height="24" rx="12" fill="#0d0f14"/>
      <text x="24" y="38" fontFamily="-apple-system, sans-serif" fontSize="11" fontWeight="600" fill="#1d1d1f">9:41</text>
      <text x="120" y="74" fontFamily="-apple-system, sans-serif" fontSize="17" fontWeight="700" fill="#1d1d1f">New Capsule</text>
      {/* Type selector */}
      <rect x="20" y="94" width="240" height="36" rx="18" fill="#f0f0f0"/>
      {(["Text","Image","Audio"] as const).map((t,i)=>{
        const tx = i===0 ? 42 : 48 + i * 80
        return <g key={t}>
          <rect x={24+i*80} y={98} width="74" height="28" rx="14" fill={i===0?"#ffffff":"transparent"} stroke={i===0?"#e8e8ed":"none"} strokeWidth="1"/>
          <text x={tx} y={116} fontFamily="-apple-system, sans-serif" fontSize="11" fill="#1d1d1f" fontWeight={i===0?"600":"400"}>{t}</text>
        </g>
      })}
      {/* Text input */}
      <rect x="20" y="146" width="240" height="140" rx="16" fill="#ffffff" stroke="#e8e8ed"/>
      <rect x="36" y="162" width="160" height="12" rx="6" fill="#d2d2d7"/>
      <rect x="36" y="182" width="200" height="10" rx="5" fill="#e8e8ed"/>
      <rect x="36" y="200" width="180" height="10" rx="5" fill="#e8e8ed"/>
      <rect x="36" y="218" width="140" height="10" rx="5" fill="#e8e8ed"/>
      <rect x="36" y="258" width="80" height="14" rx="7" fill="#f0f0f0"/>
      {/* Submit button */}
      <rect x="20" y="440" width="240" height="50" rx="25" fill="#006644"/>
      <text x="100" y="470" fontFamily="-apple-system, sans-serif" fontSize="15" fill="#ffffff" fontWeight="600">Return to Dock</text>
      <text x="100" y="555" fontFamily="-apple-system, sans-serif" fontSize="9" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function PhoneCapsulePlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 280 560" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="280" height="560" rx="36" fill="#f5f5f7"/>
      <rect x="12" y="12" width="256" height="536" rx="28" fill="#ffffff"/>
      <rect x="100" y="18" width="80" height="24" rx="12" fill="#0d0f14"/>
      <text x="24" y="38" fontFamily="-apple-system, sans-serif" fontSize="11" fontWeight="600" fill="#1d1d1f">9:41</text>
      <text x="120" y="74" fontFamily="-apple-system, sans-serif" fontSize="17" fontWeight="700" fill="#1d1d1f">Capsules</text>
      {/* Capsule list */}
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x="16" y={80+i*100} width="248" height="84" rx="16" fill="#ffffff" stroke="#e8e8ed"/>
          <rect x="28" y={96+i*100} width="36" height="36" rx="10" fill={["#006644","#4285f4","#f59e0b"][i%3]} opacity="0.15"/>
          <rect x="76" y={100+i*100} width={i%2===0?110:80} height="12" rx="6" fill="#d2d2d7"/>
          <rect x="76" y={118+i*100} width={i%2===0?150:120} height={8} rx="4" fill="#e8e8ed"/>
          <rect x="28" y={140+i*100} width="64" height="14" rx="7" fill={["rgba(0,102,68,0.1)","rgba(66,133,244,0.1)","rgba(245,158,11,0.1)"][i%3]}/>
          <text x="36" y={150+i*100} fontFamily="-apple-system, sans-serif" fontSize="9" fill="#006644" fontWeight="600">
            {["Text","Image","Audio","Text"][i]}
          </text>
        </g>
      ))}
      <text x="100" y="555" fontFamily="-apple-system, sans-serif" fontSize="9" fill="#a1a1a6">{label}</text>
    </svg>
  )
}

export function PhoneTodoPlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 280 560" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="280" height="560" rx="36" fill="#f5f5f7"/>
      <rect x="12" y="12" width="256" height="536" rx="28" fill="#ffffff"/>
      <rect x="100" y="18" width="80" height="24" rx="12" fill="#0d0f14"/>
      <text x="24" y="38" fontFamily="-apple-system, sans-serif" fontSize="11" fontWeight="600" fill="#1d1d1f">9:41</text>
      <text x="120" y="74" fontFamily="-apple-system, sans-serif" fontSize="17" fontWeight="700" fill="#1d1d1f">Todos</text>
      {/* Add button */}
      <rect x="220" y="58" width="32" height="32" rx="16" fill="#006644"/>
      <text x="231" y="79" fontFamily="-apple-system, sans-serif" fontSize="18" fill="#ffffff">+</text>
      {[0,1,2,3].map(i=>(
        <g key={i}>
          <rect x="16" y={90+i*90} width="248" height="74" rx="16" fill="#ffffff" stroke={i===1?"#006644":"#e8e8ed"} strokeWidth={i===1?2:1}/>
          <rect x="32" y={106+i*90} width="18" height="18" rx="9" fill={i%2===0?"none":"#006644"} stroke="#d2d2d7"/>
          {i%2===0 && <rect x="34" y={108+i*90} width="6" height="6" rx="3" fill="#006644"/>}
          <rect x="60" y={110+i*90} width={i%2===0?120:80} height="10" rx="5" fill={i%2===0?"#d2d2d7":"#1d1d1f"}/>
          <rect x="60" y={126+i*90} width="80" height={8} rx="4" fill="#e8e8ed"/>
        </g>
      ))}
      <text x="100" y="555" fontFamily="-apple-system, sans-serif" fontSize="9" fill="#a1a1a6">{label}</text>
    </svg>
  )
}
