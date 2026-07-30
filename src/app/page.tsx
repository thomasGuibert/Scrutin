import { createGetScrutin } from "@/api/getScrutin";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const getScrutin = createGetScrutin(new FilesystemScrutinRepository());

export default async function Home() {
  const scrutin = await getScrutin("VTANR5L17V1");

  return (
    <main>
      <div>{scrutin?.titre ?? "Scrutin introuvable"}</div>
    </main>
  );
}
