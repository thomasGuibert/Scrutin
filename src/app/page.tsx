import Link from "next/link";
import { createComparerGroupes, type ComparaisonGroupe } from "@/api/comparerGroupes";
import { createGetScrutin } from "@/api/getScrutin";
import { calculerVotants, type DecompteScrutin } from "@/domain/scrutin";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const getScrutin = createGetScrutin(new FilesystemScrutinRepository());
const comparerGroupes = createComparerGroupes(new FilesystemGroupeRepository());

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

export default async function Home() {
  const scrutin = await getScrutin("VTANR5L17V6993");
  const comparaison = scrutin ? comparerGroupes(scrutin) : [];

  return (
    <main>
      <h1 className="page-title">
        {scrutin?.titre ?? "Scrutin introuvable"}
      </h1>

      {scrutin && (
        <dl>
          <dt>Votants</dt>
          <dd>{calculerVotants(scrutin.decompte)}</dd>
          <dt>Pour</dt>
          <dd>{scrutin.decompte.pour}</dd>
          <dt>Contre</dt>
          <dd>{scrutin.decompte.contre}</dd>
          <dt>Abstentions</dt>
          <dd>{scrutin.decompte.abstentions}</dd>
        </dl>
      )}

      {comparaison.length > 0 && (
        <div className="cmp-block">
          <p className="cmp-title">Position par groupe</p>
          {comparaison.map((ligne) => (
            <LigneComparaison key={ligne.groupe.organeRef} {...ligne} />
          ))}
          <div className="cmp-legend">
            <span className="lg-pour">Pour</span>
            <span className="lg-abst">Abstention</span>
            <span className="lg-contre">Contre</span>
          </div>
        </div>
      )}

      <Link className="back-link" href="/dossier/DLR5L17N52767">
        Voir le dossier →
      </Link>
    </main>
  );
}
