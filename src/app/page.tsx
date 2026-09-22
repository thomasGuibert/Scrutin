import {
  PrototypeSwitcher,
  type PrototypeVariant,
} from "@/app/_components/PrototypeSwitcher";
import {
  VariantA,
  VariantB,
  VariantC,
  type ExempleAccroche,
} from "@/app/_components/PrototypeHomeAccroche";
import { comparerGroupes, getScrutin, listerThemesTries } from "@/app/_composition";

// PROTOTYPE — accroche "exemple" de la page d'accueil (cf. session prototype,
// pas encore capturée). Scrutin décisif du dossier DLR5L17N50627 "Lutter
// contre la pédocriminalité" : adopté à l'unanimité, 56 pour / 0 contre,
// les 11 groupes parlementaires ont voté Pour — choisi pour démontrer la
// neutralité de traitement par un fait plutôt que l'affirmer.
const EXEMPLE_SCRUTIN_UID = "VTANR5L17V1725";
const EXEMPLE_DOSSIER_REF = "DLR5L17N50627";
const EXEMPLE_TITRE = "Lutter contre la pédocriminalité";

const VARIANTS: PrototypeVariant[] = [
  { key: "A", label: "Bandeau compact au-dessus de la grille" },
  { key: "B", label: "Intégrée dans la grille (tuile vedette)" },
  { key: "C", label: "Deux colonnes, preuve détaillée" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  const current = VARIANTS.some((v) => v.key === variant) ? variant! : "A";

  const themes = await listerThemesTries();
  const scrutin = await getScrutin(EXEMPLE_SCRUTIN_UID);
  const comparaison = scrutin ? comparerGroupes(scrutin) : [];

  const exemple: ExempleAccroche = {
    titre: EXEMPLE_TITRE,
    href: `/dossier/${EXEMPLE_DOSSIER_REF}`,
    resultatLabel: "Adopté à l'unanimité (56 pour, 0 contre)",
    comparaison,
  };

  return (
    <>
      {current === "A" && <VariantA themes={themes} exemple={exemple} />}
      {current === "B" && <VariantB themes={themes} exemple={exemple} />}
      {current === "C" && <VariantC themes={themes} exemple={exemple} />}
      <PrototypeSwitcher variants={VARIANTS} current={current} basePath="/" />
    </>
  );
}
