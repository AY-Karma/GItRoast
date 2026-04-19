import React from 'react'
import { Card } from '@/ui/card'
import Button from '@/ui/button'
import ThemeToggle from '@/components/ThemeToggle'

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
  return (
    <div className="min-h-screen">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container flex items-center justify-between">
          <div className="text-xl font-semibold" aria-label="Site name">Your Name</div>
          <div className="flex items-center gap-2" aria-label="Theme toggle">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="container py-12 grid md:grid-cols-2 gap-6 items-center" id="home">
          <div>
            <h1 className="text-4xl font-bold mb-2">Hi, I'm Your Name</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">I craft modern, performant web experiences with minimal, purposeful design.</p>
            <Button variant="primary" onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}>View Projects</Button>
          </div>
          <div className="h-64 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-500"></div>
        </section>

        <section className="container py-8" id="projects">
          <h2 className="text-2xl font-semibold mb-4">Projects</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card key={p.id}>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{p.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="container py-8" id="about">
          <h2 className="text-2xl font-semibold mb-4">About</h2>
          <p className="text-gray-700 dark:text-gray-300">I'm a software engineer who values clarity, simplicity, and impact. I love turning complex problems into elegant, maintainable code and delightful user experiences.</p>
          <ul className="mt-4 list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Languages: JavaScript/TypeScript, HTML, CSS</li>
            <li>Frameworks: React, Next.js, Node.js</li>
            <li>Principles: Accessible by default, fast by design</li>
          </ul>
        </section>

        <section className="container py-8" id="contact">
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <form className="grid md:grid-cols-2 gap-4" onSubmit={(e)=>e.preventDefault()}>
            <input className="rounded-md border border-gray-300 p-2" placeholder="Name" />
            <input className="rounded-md border border-gray-300 p-2" placeholder="Email" />
            <textarea className="col-span-2 rounded-md border border-gray-300 p-2 h-28" placeholder="Message" />
            <button className="col-span-2 bg-indigo-600 text-white rounded-md px-4 py-2" type="submit">Send Message</button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default Home
