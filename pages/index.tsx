import React, { useEffect } from 'react'
import { Card } from '@/ui/card'
import Button from '@/ui/button'

type Project = { id: number; title: string; description: string }

const projects: Project[] = [
  { id: 1, title: 'Project 1', description: 'A concise description of project 1.' },
  { id: 2, title: 'Project 2', description: 'A concise description of project 2.' },
  { id: 3, title: 'Project 3', description: 'A concise description of project 3.' },
  { id: 4, title: 'Project 4', description: 'A concise description of project 4.' },
  { id: 5, title: 'Project 5', description: 'A concise description of project 5.' },
  { id: 6, title: 'Project 6', description: 'A concise description of project 6.' },
]

const Home: React.FC = () => {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )

    elements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * 90, 520)}ms`)
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen page-shell">
      <div className="ambient ambient-top" aria-hidden="true" />
      <div className="ambient ambient-bottom" aria-hidden="true" />

      <header className="p-4 border-b border-zinc-900/80 sticky top-0 z-20 backdrop-blur-xl bg-black/80">
        <div className="container flex items-center justify-between">
          <div className="text-xl font-semibold tracking-tight" aria-label="Site name">Your Name</div>
          <div className="badge-chip" aria-label="Theme mode">
            ABSOLUTE DARK
          </div>
        </div>
      </header>

      <main>
        <section className="container py-14 grid md:grid-cols-2 gap-8 items-center" id="home">
          <div data-reveal className="reveal-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">Hi, I&apos;m Your Name</h1>
            <p className="text-zinc-300 mb-6 text-lg">I craft modern, performant web experiences with minimal, purposeful design.</p>
            <Button variant="primary" onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}>View Projects</Button>
          </div>
          <div data-reveal className="reveal-right hero-visual h-72 md:h-80 rounded-2xl" />
        </section>

        <section className="container py-8" id="projects">
          <div data-reveal className="reveal-up">
            <h2 className="text-2xl font-semibold mb-4">Projects</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card key={p.id} className="project-card reveal-up" data-reveal>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                  <p className="text-sm text-zinc-400">{p.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="container py-8" id="about">
          <div data-reveal className="section-panel reveal-up">
            <h2 className="text-2xl font-semibold mb-4">About</h2>
            <p className="text-zinc-300">I&apos;m a software engineer who values clarity, simplicity, and impact. I love turning complex problems into elegant, maintainable code and delightful user experiences.</p>
            <ul className="mt-4 list-disc pl-6 text-zinc-300 space-y-1">
              <li>Languages: JavaScript/TypeScript, HTML, CSS</li>
              <li>Frameworks: React, Next.js, Node.js</li>
              <li>Principles: Accessible by default, fast by design</li>
            </ul>
          </div>
        </section>

        <section className="container py-8 pb-16" id="contact">
          <div data-reveal className="section-panel reveal-up">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <form className="grid md:grid-cols-2 gap-4" onSubmit={(e)=>e.preventDefault()}>
              <input className="field-input" placeholder="Name" />
              <input className="field-input" placeholder="Email" />
              <textarea className="col-span-2 field-input min-h-28" placeholder="Message" />
              <button className="col-span-2 bg-white text-black rounded-md px-4 py-2 font-medium transition hover:bg-zinc-200" type="submit">Send Message</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
