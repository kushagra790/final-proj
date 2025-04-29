import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container grid gap-8 px-4 py-10 sm:py-16 md:px-6 lg:px-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Company</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                About us
              </Link>
            </li>
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Careers
              </Link>
            </li>
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Services</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Online Consultation
              </Link>
            </li>
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Health Tracking
              </Link>
            </li>
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Medical Records
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Resources</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Blog
              </Link>
            </li>
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Contact</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>Email: support@welltrack.com</li>
            <li>Phone: (000) 000-0000</li>
            <li>Mon - Fri, 9:00 - 18:00</li>
          </ul>
        </div>
      </div>
      <div className="container border-t px-4 py-8 md:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        <p>© 2025 SmartFit. All rights reserved.</p>
      </div>
    </footer>
  )
}

