import { notFound } from "next/navigation";
import AbaPropertyDetail from "@/components/aba/AbaPropertyDetail";
import { readPublicProperty } from "@/lib/server/inmoRepository";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DepartamentoDetallePage({ params }: PageProps) {
  const { slug } = await params;
  const { data } = await readPublicProperty(slug);
  if (!data.listing) notFound();
  return <AbaPropertyDetail property={data.listing} />;
}
