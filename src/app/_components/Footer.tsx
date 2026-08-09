import Link from "next/link";

// Discret, en bas de chaque page (cf. .masthead pour son pendant en haut) —
// seul point d'accès permanent à la page « À propos » en dehors du bandeau,
// issue #86.
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="measure site-footer-row">
        <Link href="/a-propos">À propos</Link>
        <a
          href="https://github.com/thomasGuibert/Scrutin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code source
        </a>
      </div>
    </footer>
  );
}
