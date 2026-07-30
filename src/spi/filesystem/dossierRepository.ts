import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type {
  Dossier,
  DossierRepository,
  FicheDossier,
} from "@/domain/dossier";

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

export class FilesystemDossierRepository implements DossierRepository {
  constructor(private readonly contentDir: string = CONTENT_DIR) {}

  async getByRef(dossierRef: string): Promise<Dossier | null> {
    const filePath = path.join(this.contentDir, `${dossierRef}.md`);

    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }

    const { data, content } = matter(raw);
    const frontmatter = data as RawDossierFrontmatter;

    return {
      dossierRef: frontmatter.dossierRef,
      titre: frontmatter.titre,
      sousTheme: frontmatter.sousTheme,
      tagsImpact: frontmatter.tagsImpact ?? [],
      ficheDossier: parseFicheDossier(content),
    };
  }
}
