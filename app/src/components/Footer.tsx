import { Shield, Github, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-deep py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/10">
              <Shield size={18} className="text-accent-cyan" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-text-primary">
                Scientisec
              </span>
              <p className="text-xs text-text-muted">
                Scientific Offensive Security Workbench
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Scientisec. Built for cybersecurity research & education.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted transition-colors hover:text-accent-cyan"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted transition-colors hover:text-accent-cyan"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
