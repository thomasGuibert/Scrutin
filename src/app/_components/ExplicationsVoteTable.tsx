import { calculerVotants, formaterDecompteCourt, type LigneExplicationVote } from "@/domain/scrutin";

// Même code couleur/logique que ComparaisonGroupes (Position par groupe) —
// ce tableau absorbe ce bloc plutôt que de répéter la même information
// deux fois sur la page (cf. proto validé, issue #59).
function classePosition(position: string): string {
  if (position === "Pour") return "is-pour";
  if (position === "Contre") return "is-contre";
  return "is-divise";
}

function BarreVote({ decompte }: { decompte: LigneExplicationVote["decompte"] }) {
  const votants = calculerVotants(decompte);
  if (votants === 0) {
    return null;
  }
  return (
    <span className="vote-bar">
      <span className="vote-seg pour" style={{ width: `${(decompte.pour / votants) * 100}%` }} />
      <span
        className="vote-seg abst"
        style={{ width: `${(decompte.abstentions / votants) * 100}%` }}
      />
      <span
        className="vote-seg contre"
        style={{ width: `${(decompte.contre / votants) * 100}%` }}
      />
    </span>
  );
}

function LigneTableau({ groupe, decompte, position, resume }: LigneExplicationVote) {
  const classe = classePosition(position);
  return (
    <tr>
      <td className="col-groupe">{groupe.abreviation}</td>
      <td className="col-vote">
        <div className={`vote-cell ${classe}`}>
          <span className={`vote-label ${classe}`}>{position}</span>
          <BarreVote decompte={decompte} />
          <span className="vote-count">{formaterDecompteCourt(decompte)}</span>
        </div>
      </td>
      <td className={`col-explication${resume ? "" : " is-empty"}`}>
        {resume ?? "Pas d'explication de vote retrouvée en séance pour ce groupe."}
      </td>
    </tr>
  );
}

// Tableau Groupe / Position / Explication de vote — toujours les groupes
// ayant voté sur ce scrutin (jamais d'omission au-delà d'un budget de
// caractères, contrairement à l'ancien extrait, cf. issue #56/#57),
// triés comme dans l'hémicycle (cf. ComparaisonGroupes, même convention).
export function ExplicationsVoteTable({
  explicationsParGroupe,
}: {
  explicationsParGroupe: LigneExplicationVote[];
}) {
  const trie = [...explicationsParGroupe].sort(
    (a, b) => a.groupe.ordreHemicycle - b.groupe.ordreHemicycle
  );

  return (
    <>
      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <caption>Explications de vote, par groupe</caption>
          <thead>
            <tr>
              <th scope="col">Groupe</th>
              <th scope="col">Position</th>
              <th scope="col">Explication de vote</th>
            </tr>
          </thead>
          <tbody>
            {trie.map((ligne) => (
              <LigneTableau key={ligne.groupe.organeRef} {...ligne} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="cmp-legend">
        <span className="lg-pour">Pour</span>
        <span className="lg-contre">Contre</span>
        <span className="lg-divise">Divisé</span>
      </div>
    </>
  );
}
