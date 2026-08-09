export const metadata = {
  title: "À propos — Scrutins",
  description:
    "Objectif du site, signification de « Au-delà du discours » et rôle de l'IA dans la rédaction du contenu.",
};

export default function APropos() {
  return (
    <main>
      <h1 className="page-title">À propos</h1>

      <section className="about-section">
        <h2 className="about-heading">Objectif</h2>
        <p>
          Ce site donne une lecture factuelle et pédagogique des votes des
          député·es et des groupes parlementaires à l&apos;Assemblée
          nationale, à partir des données ouvertes qu&apos;elle publie. Les
          scrutins sont classés par thème plutôt que par groupe ou par
          personnalité : l&apos;idée est de pouvoir comparer les positions
          réelles sur un sujet donné, pas de suivre un camp.
        </p>
      </section>

      <section className="about-section">
        <h2 className="about-heading">« Au-delà du discours »</h2>
        <p>
          Ce sous-titre résume le parti pris du site : donner la parole aux
          votes eux-mêmes — ce que chaque groupe a réellement voté, texte par
          texte — plutôt qu&apos;à la communication qui les accompagne. Les
          prises de position rapportées ici (résumés d&apos;explications de
          vote, discours de séance) sont toujours reliées à un vote réel et
          vérifiable, jamais isolées ou hors contexte.
        </p>
      </section>

      <section className="about-section">
        <h2 className="about-heading">Le rôle de l&apos;IA</h2>
        <p>
          Une grande partie de la rédaction (fiches dossier, résumés
          d&apos;explications de vote, mise en contexte de certains votes)
          est produite avec l&apos;assistance d&apos;une intelligence
          artificielle, sous supervision humaine. Concrètement : chaque
          résumé attribué à un groupe est rédigé à partir du compte rendu
          réel de la séance — jamais inventé, jamais déduit du ton
          d&apos;une intervention — et vérifié avant publication. Quand la
          source manque ou reste ambiguë, le site l&apos;indique
          explicitement plutôt que de combler le vide.
        </p>
      </section>

      <section className="about-section">
        <h2 className="about-heading">Sources des données</h2>
        <p>
          Les votes, dossiers législatifs et comptes rendus proviennent des
          données ouvertes de l&apos;Assemblée nationale (
          <a
            href="https://data.assemblee-nationale.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            data.assemblee-nationale.fr
          </a>
          ). Le code source du site est public sur{" "}
          <a
            href="https://github.com/thomasGuibert/Scrutin"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </main>
  );
}
