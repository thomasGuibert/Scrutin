import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type {
  Dossier,
  DossierRepository,
  FicheDossier,
} from "@/domain/dossier";
import type { TaxonomyRepository } from "@/domain/taxonomie";
import { DeclaredTaxonomyRepository } from "@/spi/filesystem/taxonomie";

const CONTENT_DIR = path.join(process.cwd(), "content/dossiers");

const DOSSIER_REF_VALIDE = /^[A-Za-z0-9]+$/;

type RawDossierFrontmatter = {
  dossierRef: string;
  titre: string;
  sousTheme: string;
  tagsImpact?: string[];
};

function requireSection(byHeading: Map<string, string>, heading: string): string {
  const section = byHeading.get(heading);
  if (!section) {
    throw new Error(
      `Fiche dossier : section "## ${heading}" manquante ou vide.`
    );
  }
  return section;
}

function parseFicheDossier(body: string): FicheDossier {
  const sections = body
    .split(/^##\s+/m)
    .map((section) => section.trim())
    .filter(Boolean);

  const byHeading = new Map<string, string>();
  for (const section of sections) {
    const [heading, ...rest] = section.split("\n");
    byHeading.set(heading.trim(), rest.join("\n").trim());
  }

  return {
    contexte: requireSection(byHeading, "Contexte"),
    action: requireSection(byHeading, "Action"),
    resultatAttendu: requireSection(byHeading, "Résultat attendu"),
  };
}

export type FilesystemDossierRepositoryOptions = {
  contentDir?: string;
  taxonomyRepository?: TaxonomyRepository;
};

export class FilesystemDossierRepository implements DossierRepository {
  private readonly contentDir: string;
  private readonly taxonomyRepository: TaxonomyRepository;
  private tousLesDossiers: Promise<Dossier[]> | null = null;

  constructor({
    contentDir = CONTENT_DIR,
    taxonomyRepository = new DeclaredTaxonomyRepository(),
  }: FilesystemDossierRepositoryOptions = {}) {
    this.contentDir = contentDir;
    this.taxonomyRepository = taxonomyRepository;
  }

  async getByRef(dossierRef: string): Promise<Dossier | null> {
    // dossierRef vient directement du segment d'URL /dossier/[dossierRef]
    // (params non couverts par generateStaticParams tombent quand même ici,
    // Next ne les rejette pas avant l'appel). Sans ce garde-fou, un
    // dossierRef du type "../../CLAUDE" traverserait content/dossiers/ pour
    // lire n'importe quel *.md accessible par chemin relatif. Tous les
    // dossierRef réels sont alphanumériques (ex. DLR5L17N50882) — un dossier
    // absent ou malformé est traité identiquement (404), sans distinguer les
    // deux cas pour ne rien révéler côté page.
    if (!DOSSIER_REF_VALIDE.test(dossierRef)) {
      return null;
    }

    const filePath = path.join(this.contentDir, `${dossierRef}.md`);

    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }

    return this.parseDossier(raw);
  }

  async getBySousTheme(slug: string): Promise<Dossier[]> {
    const dossiers = await this.getTousLesDossiers();
    return dossiers.filter((dossier) => dossier.sousTheme === slug);
  }

  async getByTagImpact(tag: string): Promise<Dossier[]> {
    const dossiers = await this.getTousLesDossiers();
    return dossiers.filter((dossier) => dossier.tagsImpact.includes(tag));
  }

  // Lit et parse chaque fichier de content/dossiers/ une seule fois par
  // instance de repository, plutôt qu'à chaque appel de getBySousTheme ou
  // getByTagImpact — même logique que le cache d'archive de
  // FilesystemScrutinRepository.
  private getTousLesDossiers(): Promise<Dossier[]> {
    if (!this.tousLesDossiers) {
      this.tousLesDossiers = this.lireTousLesDossiers();
    }
    return this.tousLesDossiers;
  }

  private async lireTousLesDossiers(): Promise<Dossier[]> {
    const fichiers = await fs.readdir(this.contentDir);
    return Promise.all(
      fichiers
        .filter((fichier) => fichier.endsWith(".md"))
        .map(async (fichier) => {
          const raw = await fs.readFile(
            path.join(this.contentDir, fichier),
            "utf-8"
          );
          return this.parseDossier(raw);
        })
    );
  }

  private parseDossier(raw: string): Dossier {
    const { data, content } = matter(raw);
    const frontmatter = data as RawDossierFrontmatter;

    if (!this.taxonomyRepository.trouverSousTheme(frontmatter.sousTheme)) {
      throw new Error(
        `Dossier "${frontmatter.dossierRef}" : sous-thème "${frontmatter.sousTheme}" absent de la taxonomie déclarée.`
      );
    }

    return {
      dossierRef: frontmatter.dossierRef,
      titre: frontmatter.titre,
      sousTheme: frontmatter.sousTheme,
      tagsImpact: frontmatter.tagsImpact ?? [],
      ficheDossier: parseFicheDossier(content),
    };
  }
}
