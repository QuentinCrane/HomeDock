import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Anchor,
  Archive,
  ArrowsClockwise,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Code,
  Detective,
  DeviceMobile,
  FlowArrow,
  GithubLogo,
  Image as ImageIcon,
  ListChecks,
  Microphone,
  PlusCircle,
  ShieldCheck,
  TextAa,
  WifiSlash,
} from '@phosphor-icons/react'

import imgCover from '../../assets/cover.png'
import imgHome from '../../assets/home.png'
import imgEcho from '../../assets/echo.png'
import imgWall from '../../assets/wall.png'
import imgArchive from '../../assets/archive.png'
import imgTodo from '../../assets/todo.png'
import imgNight from '../../assets/night.png'
import imgPhoneHome from '../../assets/phone-home.png'
import imgPhoneSubmit from '../../assets/phone-submit.png'
import imgPhoneCapsule from '../../assets/phone-capsule.png'
import imgPhoneTodo from '../../assets/phone-todo.png'

gsap.registerPlugin(ScrollTrigger)

const REPO_URL = 'https://github.com/QuentinCrane/HomeDock'

const navLinks = [
  { label: '概览', href: '#overview' },
  { label: '归航', href: '#loop' },
  { label: '界面', href: '#screens' },
  { label: '架构', href: '#stack' },
]

const facts = [
  { value: '0', label: '账号系统' },
  { value: 'LAN', label: '通信范围' },
  { value: '3', label: '胶囊类型' },
  { value: '2', label: '协同终端' },
]

const manifestoCards = [
  {
    title: '不是云产品',
    body: '不依赖公网，不要求登录，也不把内容默认送往别处。',
    icon: <ShieldCheck size={26} weight="light" />,
  },
  {
    title: '不是团队工具',
    body: '它不试图变成协作文档系统，而是给个人设备留出一块更安静的本地空间。',
    icon: <Anchor size={26} weight="light" />,
  },
  {
    title: '不是普通上传',
    body: '同步动作被命名为 Return to Dock。它更像归航，而不是提交表单。',
    icon: <ArrowsClockwise size={26} weight="light" />,
  },
]

const loopSteps = [
  {
    id: '01',
    title: 'Capture on mobile',
    body: '在 Android Terminal 上记录一句话、拍一张图，或留下短音频。',
    tag: 'Text / Image / Audio',
    icon: <PlusCircle size={24} weight="light" />,
  },
  {
    id: '02',
    title: 'Store offline first',
    body: '内容先落在手机本地队列里。即使没有网络，记录行为本身仍然成立。',
    tag: 'Room queue',
    icon: <DeviceMobile size={24} weight="light" />,
  },
  {
    id: '03',
    title: 'Return to the same LAN',
    body: '手机和电脑回到同一局域网，系统通过 mDNS / NSD 自动发现 Web Base。',
    tag: 'mDNS / NSD',
    icon: <Detective size={24} weight="light" />,
  },
  {
    id: '04',
    title: 'Return to Dock',
    body: '只需要一次明确动作。你不是在上传，而是在把内容带回自己的基地。',
    tag: 'Ritual sync',
    icon: <FlowArrow size={24} weight="light" />,
  },
  {
    id: '05',
    title: 'Browse, archive, revisit',
    body: '桌面端负责查看、整理、归档与再次回看，把碎片变成长期可居住的内容空间。',
    tag: 'Wall / Echo / Archive',
    icon: <Archive size={24} weight="light" />,
  },
]

const baseSpaces = [
  {
    name: 'Home Base',
    title: '基地首页是整个系统的回港面板',
    copy: '同步状态、近期碎片、局域网状态和空间入口，都从这里开始。',
    image: imgHome,
    className: 'space-card--wide',
  },
  {
    name: 'Fragment Wall',
    title: '碎片墙把回收内容变成可浏览的面',
    copy: '从时间顺序走向可视化排布，内容不再只是列表。',
    image: imgWall,
  },
  {
    name: 'Echo',
    title: 'Echo 给旧内容第二次出现的机会',
    copy: '不是提醒工具，而是让沉淀过的内容重新回到视野。',
    image: imgEcho,
  },
  {
    name: 'Archive Vault',
    title: '归档库保留长期记忆',
    copy: '本地 SQLite 与文件存储让内容真正留在你的设备里。',
    image: imgArchive,
  },
  {
    name: 'Night + Silent Mode',
    title: '夜间与静默模式降低视觉刺激',
    copy: '更深的暗色、更少的动态干扰，适合长时间停留和整理。',
    image: imgNight,
    className: 'space-card--tall',
  },
  {
    name: 'Todos',
    title: '待办事项与胶囊共享一条归航路径',
    copy: '手机创建，回到基地同步，维持轻量而连续的个人节律。',
    image: imgTodo,
  },
]

const phoneShots = [
  { label: 'Home', image: imgPhoneHome },
  { label: 'Submit', image: imgPhoneSubmit },
  { label: 'Capsule', image: imgPhoneCapsule },
  { label: 'Todo', image: imgPhoneTodo },
]

const galleryShots = [
  { label: 'Desktop home', image: imgHome, type: 'wide' },
  { label: 'Mobile capture', image: imgPhoneCapsule, type: 'phone' },
  { label: 'Echo space', image: imgEcho, type: 'wide' },
  { label: 'Archive vault', image: imgArchive, type: 'wide' },
  { label: 'Mobile dock', image: imgPhoneHome, type: 'phone' },
  { label: 'Night mode', image: imgNight, type: 'wide' },
]

const stackPanels = [
  {
    title: 'Web Base',
    subtitle: '本地电脑上的主基地',
    icon: <Code size={22} weight="light" />,
    items: ['React 19', 'Vite 8', 'Express 5', 'SQLite', 'Tailwind CSS 4', 'Framer Motion 12', 'SSE', 'Bonjour-service'],
  },
  {
    title: 'Android Terminal',
    subtitle: '轻量采集与回港终端',
    icon: <DeviceMobile size={22} weight="light" />,
    items: ['Kotlin', 'Jetpack Compose', 'Room', 'Retrofit', 'OkHttp', 'CameraX', 'Coil', 'NSD / mDNS'],
  },
]

const routePills = ['LAN-first', 'Offline-first', 'HTTP API', 'mDNS Discovery', 'SSE Feedback', 'Local Files', 'Private by Default']

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)" />
      <path d="M8.5 21.5L16 10.5L23.5 21.5" stroke="url(#dockGradient)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="21.5" r="2" fill="#FFD7AD" />
      <defs>
        <linearGradient id="dockGradient" x1="8.5" y1="21.5" x2="23.5" y2="10.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7FD6C7" />
          <stop offset="1" stopColor="#FFF4E3" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function handleShellMove(event: React.PointerEvent<HTMLElement>) {
  const target = event.currentTarget
  const rect = target.getBoundingClientRect()
  const px = (event.clientX - rect.left) / rect.width
  const py = (event.clientY - rect.top) / rect.height
  target.style.setProperty('--pointer-x', `${px * 100}%`)
  target.style.setProperty('--pointer-y', `${py * 100}%`)
  target.style.setProperty('--rotate-x', `${(0.5 - py) * 7}deg`)
  target.style.setProperty('--rotate-y', `${(px - 0.5) * 10}deg`)
}

function resetShellMove(event: React.PointerEvent<HTMLElement>) {
  const target = event.currentTarget
  target.style.setProperty('--rotate-x', '0deg')
  target.style.setProperty('--rotate-y', '0deg')
  target.style.setProperty('--pointer-x', '50%')
  target.style.setProperty('--pointer-y', '50%')
}

function App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
    })

    lenisRef.current = lenis

    const onTick = (time: number) => {
      lenis.raf(time * 1000)
    }

    const onScroll = () => ScrollTrigger.update()

    lenis.on('scroll', onScroll)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    if (menuOpen) {
      lenisRef.current?.stop()
      document.body.style.overflow = 'hidden'
    } else {
      lenisRef.current?.start()
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      gsap.from('.hero-eyebrow, .hero-title-line, .hero-copy, .hero-actions, .hero-facts .fact-card', {
        y: 42,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.08,
      })

      gsap.from('.hero-stage-shell', {
        y: 54,
        opacity: 0,
        scale: 0.96,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.18,
      })

      gsap.to('.hero-orb--a', {
        yPercent: -14,
        xPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.to('.hero-orb--b', {
        yPercent: -10,
        xPercent: -7,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      })

      gsap.utils.toArray<HTMLElement>('[data-float]').forEach((node, index) => {
        gsap.to(node, {
          y: index % 2 === 0 ? -14 : 14,
          duration: 3.8 + index * 0.4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((node, index) => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 60, filter: 'blur(14px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1,
            ease: 'power3.out',
            delay: (index % 3) * 0.05,
            scrollTrigger: {
              trigger: node,
              start: 'top 86%',
            },
          },
        )
      })

      mm.add('(min-width: 961px)', () => {
        const galleryTrack = rootRef.current?.querySelector('.gallery-track') as HTMLElement | null
        const galleryPin = rootRef.current?.querySelector('.gallery-pin') as HTMLElement | null

        if (galleryTrack && galleryPin) {
          gsap.to(galleryTrack, {
            x: () => -(galleryTrack.scrollWidth - window.innerWidth + 96),
            ease: 'none',
            scrollTrigger: {
              trigger: galleryPin,
              start: 'top top',
              end: () => `+=${Math.max(1200, galleryTrack.scrollWidth - window.innerWidth + 260)}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
        }
      })
    }, rootRef)

    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <div className="app-shell" ref={rootRef}>
      <a className="skip-link" href="#content">
        跳到内容
      </a>

      <div className="noise-layer" aria-hidden="true" />
      <div className="hero-orb hero-orb--a" aria-hidden="true" />
      <div className="hero-orb hero-orb--b" aria-hidden="true" />

      <header className="site-header">
        <div className="nav-shell">
          <a className="brand-lockup" href="#top" aria-label="HomeDock">
            <BrandMark />
            <span>HomeDock</span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <a className="nav-cta" href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub
              <span className="nav-cta__icon">
                <ArrowUpRight size={14} weight="light" />
              </span>
            </a>

            <button
              className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
              type="button"
              aria-label="切换菜单"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className={`mobile-menu${menuOpen ? ' is-open' : ''}`}>
          <div className="mobile-menu__panel">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <a href={REPO_URL} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
              查看仓库
            </a>
          </div>
        </div>
      </header>

      <main id="content">
        <section className="hero section" id="top">
          <div className="container hero-grid">
            <div className="hero-copy-block">
              <span className="eyebrow hero-eyebrow">Personal base. Local only. A place to return.</span>
              <h1 className="hero-title">
                <span className="hero-title-line">把内容带回</span>
                <span className="hero-title-line">你自己的局域网母港</span>
              </h1>
              <p className="hero-copy">
                HomeDock 是一个离线优先、LAN-only 的双端系统。
                <br />
                它让手机负责采集，让电脑成为基地，把同步这件事重新变成一次明确而安静的归航动作。
              </p>

              <div className="hero-actions">
                <a className="button button--primary" href={REPO_URL} target="_blank" rel="noreferrer">
                  查看 GitHub
                  <span className="button__icon">
                    <GithubLogo size={16} weight="fill" />
                  </span>
                </a>
                <a className="button button--secondary" href="#overview">
                  继续浏览
                  <span className="button__icon">
                    <ArrowDown size={16} weight="light" />
                  </span>
                </a>
              </div>

              <div className="hero-facts">
                {facts.map((fact) => (
                  <article key={fact.label} className="fact-card double-shell">
                    <div className="double-shell__inner">
                      <strong>{fact.value}</strong>
                      <span>{fact.label}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="hero-stage" data-reveal>
              <div
                className="hero-stage-shell double-shell interactive-shell"
                onPointerMove={handleShellMove}
                onPointerLeave={resetShellMove}
              >
                <div className="double-shell__inner hero-stage__inner">
                  <img className="hero-cover" src={imgCover} alt="HomeDock 封面概念图" />
                  <div className="hero-stage__veil" />
                  <div className="hero-stage__meta">
                    <span>归航 / HomeDock</span>
                    <span>Offline-first personal system</span>
                  </div>
                  <article className="floating-chip chip chip--status" data-float>
                    <span className="chip-dot" />
                    Web Base online
                  </article>
                  <article className="floating-chip chip chip--capsule" data-float>
                    <TextAa size={16} weight="light" />
                    Text capsule ready
                  </article>
                  <article className="floating-chip chip chip--image" data-float>
                    <ImageIcon size={16} weight="light" />
                    Image returned
                  </article>
                  <article className="floating-chip chip chip--audio" data-float>
                    <Microphone size={16} weight="light" />
                    Audio stored locally
                  </article>
                  <div className="floating-screen floating-screen--desktop" data-float>
                    <img src={imgNight} alt="HomeDock 夜间界面" />
                  </div>
                  <div className="floating-screen floating-screen--phone" data-float>
                    <img src={imgPhoneHome} alt="Android Terminal 首页界面" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overview section" id="overview">
          <div className="container overview-grid">
            <div className="overview-copy" data-reveal>
              <span className="eyebrow">What HomeDock is</span>
              <h2 className="section-title">不是把本地空间做成云产品的替身</h2>
              <p className="section-copy">
                README 里最重要的那条线索很清楚：HomeDock 不是协作平台，不是传统笔记应用，也不是更复杂的上传工具。
                它更接近一个只存在于你房间、桌面和局域网里的小型个人系统。
              </p>
              <blockquote className="quote-card double-shell">
                <div className="double-shell__inner">
                  <p>
                    “Build a small system that belongs only to you, and let it live entirely inside your local
                    network.”
                  </p>
                </div>
              </blockquote>
            </div>

            <div className="manifesto-grid">
              {manifestoCards.map((card) => (
                <article
                  key={card.title}
                  className="manifesto-card double-shell interactive-shell"
                  data-reveal
                  onPointerMove={handleShellMove}
                  onPointerLeave={resetShellMove}
                >
                  <div className="double-shell__inner">
                    <div className="manifesto-card__icon">{card.icon}</div>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="loop-section section" id="loop">
          <div className="container loop-grid">
            <div className="loop-shell-wrap">
              <div className="loop-shell double-shell" data-reveal>
                <div className="double-shell__inner">
                  <span className="eyebrow">Return to Dock</span>
                  <h2 className="section-title">一次更像归航的同步</h2>
                  <p className="section-copy">
                    这个项目的主角不是“上传”，而是“回到基地”。从手机采集到桌面整理，每一步都围绕这个核心循环展开。
                  </p>
                  <div className="loop-shell__legend">
                    <span>
                      <WifiSlash size={16} weight="light" />
                      no internet required
                    </span>
                    <span>
                      <ArrowsClockwise size={16} weight="light" />
                      ritualized sync
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="loop-list">
              {loopSteps.map((step) => (
                <article key={step.id} className="loop-card double-shell" data-reveal>
                  <div className="double-shell__inner">
                    <div className="loop-card__top">
                      <span className="loop-card__id">{step.id}</span>
                      <span className="loop-card__tag">{step.tag}</span>
                    </div>
                    <div className="loop-card__icon">{step.icon}</div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="screens-section section" id="screens">
          <div className="container">
            <div className="section-heading" data-reveal>
              <span className="eyebrow">Inside the base</span>
              <h2 className="section-title">真实素材，真实界面，不是概念空壳</h2>
              <p className="section-copy">
                页面内容全部来自 README 的系统描述和仓库里的真实截图。桌面端负责容纳，移动端负责采集，视觉语言围绕“归航”统一展开。
              </p>
            </div>

            <div className="spaces-grid">
              {baseSpaces.map((space) => (
                <article
                  key={space.name}
                  className={`space-card double-shell interactive-shell ${space.className ?? ''}`}
                  data-reveal
                  onPointerMove={handleShellMove}
                  onPointerLeave={resetShellMove}
                >
                  <div className="double-shell__inner">
                    <div className="space-card__media">
                      <img src={space.image} alt={space.title} loading="lazy" />
                    </div>
                    <div className="space-card__content">
                      <span>{space.name}</span>
                      <h3>{space.title}</h3>
                      <p>{space.copy}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="terminal-section section">
          <div className="container terminal-grid">
            <div className="terminal-copy" data-reveal>
              <span className="eyebrow">Android Terminal</span>
              <h2 className="section-title">轻量采集端，负责在外部世界先把内容抓住</h2>
              <p className="section-copy">
                手机端不是桌面端的缩小版。它更像一个采集终端，先保存，再等待回港。文字、图片、录音和待办事项，共用一条离线优先的本地路径。
              </p>
              <div className="terminal-points">
                <span>
                  <TextAa size={16} weight="light" />
                  text capsules
                </span>
                <span>
                  <ImageIcon size={16} weight="light" />
                  image capsules
                </span>
                <span>
                  <Microphone size={16} weight="light" />
                  audio capsules
                </span>
                <span>
                  <ListChecks size={16} weight="light" />
                  todos
                </span>
              </div>
            </div>

            <div className="phone-arc" data-reveal>
              {phoneShots.map((shot, index) => (
                <figure
                  key={shot.label}
                  className={`phone-card phone-card--${index + 1} double-shell`}
                  data-float
                >
                  <div className="double-shell__inner">
                    <img src={shot.image} alt={shot.label} loading="lazy" />
                    <figcaption>{shot.label}</figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="gallery-section section">
          <div className="gallery-pin">
            <div className="gallery-intro container" data-reveal>
              <span className="eyebrow">Real screenshots in motion</span>
              <h2 className="section-title">一路展开，看完整个系统的空间层次</h2>
              <p className="section-copy">
                用横向滚动把桌面与移动截图串在一起，让浏览本身也更接近一次缓慢滑行的归航过程。
              </p>
            </div>

            <div className="gallery-track">
              {galleryShots.map((shot) => (
                <figure key={shot.label} className={`gallery-card gallery-card--${shot.type}`}>
                  <div className="gallery-card__image">
                    <img src={shot.image} alt={shot.label} loading="lazy" />
                  </div>
                  <figcaption>{shot.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="stack-section section" id="stack">
          <div className="container stack-grid">
            <div className="stack-copy" data-reveal>
              <span className="eyebrow">Technical route</span>
              <h2 className="section-title">双端分工清晰，链路保持克制</h2>
              <p className="section-copy">
                Web Base 提供本地服务、文件与 SQLite 存储、桌面展示与 SSE 反馈；Android Terminal 提供 Room 本地队列、采集能力与局域网发现。
              </p>

              <div className="route-cloud">
                {routePills.map((pill) => (
                  <span key={pill}>{pill}</span>
                ))}
              </div>
            </div>

            <div className="stack-panels">
              {stackPanels.map((panel) => (
                <article key={panel.title} className="stack-panel double-shell" data-reveal>
                  <div className="double-shell__inner">
                    <div className="stack-panel__head">
                      <div className="stack-panel__icon">{panel.icon}</div>
                      <div>
                        <h3>{panel.title}</h3>
                        <p>{panel.subtitle}</p>
                      </div>
                    </div>
                    <div className="stack-panel__pills">
                      {panel.items.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="closing-section section">
          <div className="container">
            <div className="closing-shell double-shell" data-reveal>
              <div className="double-shell__inner">
                <span className="eyebrow">Final note</span>
                <h2 className="section-title">它不是你“必须拥有”的系统，而是你愿意为自己建的一块本地领地</h2>
                <p className="section-copy">
                  当互联网不在场，HomeDock 仍然成立。它把最小化基础设施、最清晰的设备分工和最私有的数据路径，组合成一个真正属于你自己的小系统。
                </p>

                <div className="closing-actions">
                  <a className="button button--primary" href={REPO_URL} target="_blank" rel="noreferrer">
                    打开仓库
                    <span className="button__icon">
                      <GithubLogo size={16} weight="fill" />
                    </span>
                  </a>
                  <a className="button button--secondary" href={`${REPO_URL}#readme`} target="_blank" rel="noreferrer">
                    阅读 README
                    <span className="button__icon">
                      <BookOpen size={16} weight="light" />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
