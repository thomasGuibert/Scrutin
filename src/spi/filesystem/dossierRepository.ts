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

  constructor({
    contentDir = CONTENT_DIR,
    taxonomyRepository = new DeclaredTaxonomyRepository(),
  }: FilesystemDossierRepositoryOptions = {}) {
    this.contentDir = contentDir;
    this.taxonomyRepository = taxonomyRepository;
  }

  async getByRef(dossierRef: string): Promise<Dossier | null> {
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
    const fichiers = await fs.readdir(this.contentDir);
    const dossiers = await Promise.all(
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

    return dossiers.filter((dossier) => dossier.sousTheme === slug);
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
