import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import { calculerVotants, type DecompteScrutin } from "@/domain/scrutin";

function badgeClass(position: string): string {
  if (position === "Pour") return "cmp-badge-pour";
  if (position === "Contre") return "cmp-badge-contre";
  return "cmp-badge-divise";
}

function largeurSegment(valeur: number, decompte: DecompteScrutin): string {
  return `${(valeur / calculerVotants(decompte)) * 100}%`;
}

function LigneComparaison({ groupe, decompte, position }: ComparaisonGroupe) {
  return (
    <div className="cmp-row">
      <span className="cmp-group">{groupe.abreviation}</span>
      <span className="cmp-bar">
        <span
          className="cmp-seg cmp-pour"
          style={{ width: largeurSegment(decompte.pour, decompte) }}
        />
        <span
          className="cmp-seg cmp-abst"
          style={{ width: largeurSegment(decompte.abstentions, decompte) }}
        />
        <span
          className="cmp-seg cmp-contre"
          style={{ width: largeurSegment(decompte.contre, decompte) }}
        />
      </span>
      <span className={`cmp-badge ${badgeClass(position)}`}>{position}</span>
    </div>
  );
}

export function ComparaisonGroupes({
  titre,
  comparaison,
}: {
  titre: string;
  comparaison: ComparaisonGroupe[];
}) {
  if (comparaison.length === 0) {
    return null;
  }

  return (
    <div className="cmp-block">
      <p className="cmp-title">{titre}</p>
      {comparaison.map((ligne) => (
        <LigneComparaison key={ligne.groupe.organeRef} {...ligne} />
      ))}
      <div className="cmp-legend">
        <span className="lg-pour">Pour</span>
        <span className="lg-abst">Abstention</span>
        <span className="lg-contre">Contre</span>
      </div>
    </div>
  );
}
