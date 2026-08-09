import Link from "next/link";
import { listerThemesTries } from "@/app/_composition";

export default async function Home() {
  const themes = await listerThemesTries();

  return (
    <main>
      <h1 className="page-title">Scrutins</h1>
      <p className="page-gloss">
        Consultez les votes réels de l&apos;Assemblée nationale, classés par
        thème : comparez ce que les groupes parlementaires ont concrètement
        voté, dossier par dossier, au-delà de leur communication.
      </p>

      <div className="a-grid">
        {themes.map(({ theme, nombreDossiers }, index) => (
          <Link
            key={theme.slug}
            href={`/theme/${theme.slug}`}
            className={index === 0 ? "a-tile a-tile-feature" : "a-tile"}
          >
            <span className="a-tile-name">{theme.nom}</span>
            <span className="a-tile-gloss">{theme.description}</span>
            <span className="a-tile-arrow">
              {nombreDossiers} dossier{nombreDossiers > 1 ? "s" : ""} →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
