import Image from "next/image";
import Link from "next/link";

export function SimpleFooter() {
  return (
    <footer className="asb-simple-footer">
      <div className="asb-simple-footer-inner">
        <div className="asb-simple-footer-brand">
          <Link href="/" aria-label="As-Sabiquun home">
            <Image src="/brand/as-sabiquun-seal.svg" width={802} height={800} sizes="48px" alt="" />
            <span>As-Sabiquun</span>
          </Link>
          <p>Islamic services organised with care, clarity, and accountability.</p>
        </div>
        <nav className="asb-simple-footer-group" aria-label="Ways to give">
          <p>Ways to give</p>
          <Link href="/korban">Korban</Link>
          <Link href="/wakaf/water-pump">Wakaf water</Link>
          <Link href="/wakaf/quran">Wakaf Quran</Link>
          <Link href="/wakaf/food-for-orphans">Food for orphans</Link>
        </nav>
        <nav className="asb-simple-footer-group" aria-label="Explore">
          <p>Explore</p>
          <Link href="/services">Services</Link>
          <Link href="/about">About</Link>
          <Link href="/#how">Field stories</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav className="asb-simple-footer-group" aria-label="Account">
          <p>Account</p>
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Create account</Link>
          <Link href="/partner-login">Partner login</Link>
        </nav>
      </div>
      <div className="asb-simple-footer-bottom">
        <small>© {new Date().getFullYear()} As-Sabiquun Association Consultancy</small>
        <nav aria-label="Social links">
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
        </nav>
      </div>
    </footer>
  );
}
