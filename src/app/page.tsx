import Link from "next/link";
import { createGetScrutin } from "@/api/getScrutin";
import { trouverGroupe } from "@/spi/filesystem/groupes";
import {
  calculerPosition,
  calculerVotants,
  type DecompteScrutin,
} from "@/domain/scrutin";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const getScrutin = createGetScrutin(new FilesystemScrutinRepository());

function badgeClass(position: string): string {
  if (position === "Pour") return "cmp-badge-pour";
  if (position === "Contre") return "cmp-badge-contre";
  return "cmp-badge-divise";
}

function largeurSegment(valeur: number, decompte: DecompteScrutin): string {
  return `${(valeur / calculerVotants(decompte)) * 100}%`;
}

export default async function Home() {
  const scrutin = await getScrutin("VTANR5L17V6993");
  const positionDR = scrutin?.positionsParGroupe.find(
    (position) => position.organeRef === "PO845425"
  );
  const groupeDR = trouverGroupe("PO845425");
  const positionCalculeeDR = positionDR && calculerPosition(positionDR.decompte);

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

      {positionDR && groupeDR && positionCalculeeDR && (
        <div className="cmp-block">
          <p className="cmp-title">Position par groupe</p>
          <div className="cmp-row">
            <span className="cmp-group">{groupeDR.abreviation}</span>
            <span className="cmp-bar">
              <span
                className="cmp-seg cmp-pour"
                style={{
                  width: largeurSegment(
                    positionDR.decompte.pour,
                    positionDR.decompte
                  ),
                }}
              />
              <span
                className="cmp-seg cmp-abst"
                style={{
                  width: largeurSegment(
                    positionDR.decompte.abstentions,
                    positionDR.decompte
                  ),
                }}
              />
              <span
                className="cmp-seg cmp-contre"
                style={{
                  width: largeurSegment(
                    positionDR.decompte.contre,
                    positionDR.decompte
                  ),
                }}
              />
            </span>
            <span className={`cmp-badge ${badgeClass(positionCalculeeDR)}`}>
              {positionCalculeeDR}
            </span>
          </div>
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
