import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1 className="page-title">Scrutin</h1>
      <p className="page-gloss">
        Consultez les votes réels de l&apos;Assemblée nationale, classés par
        thème, sans jugement de valeur.
      </p>
      <Link className="back-link" href="/dossier/DLR5L17N52767">
        Voir un dossier →
      </Link>
    </main>
  );
}
