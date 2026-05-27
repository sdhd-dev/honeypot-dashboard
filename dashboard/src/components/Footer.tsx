import { Github } from 'lucide-react'

// TODO: replace with the real repository URL once published.
const GITHUB_URL = 'https://github.com/your-username/honeypot-dashboard'

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-800/80 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center text-xs text-slate-500 sm:px-6">
        <p>
          Built with <span className="text-slate-400">React</span> ·{' '}
          <span className="text-slate-400">Tailwind</span> ·{' '}
          <span className="text-slate-400">Recharts</span> ·{' '}
          <span className="text-slate-400">Leaflet</span>
        </p>
        <p>
          Backend: <span className="text-slate-400">Cowrie</span> ·{' '}
          <span className="text-slate-400">PostgreSQL</span> ·{' '}
          <span className="text-slate-400">Python ETL</span> ·{' '}
          <span className="text-slate-400">GeoIP</span> ·{' '}
          <span className="text-slate-400">FastAPI</span> ·{' '}
          <span className="text-slate-400">nginx</span>
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-800 px-3 py-1.5 text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
        >
          <Github className="h-3.5 w-3.5" />
          View source on GitHub
        </a>
      </div>
    </footer>
  )
}
