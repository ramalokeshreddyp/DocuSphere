import dynamic from "next/dynamic";
import { getDictionary } from "../../../lib/i18n";

const ApiReference = dynamic(() => import("../../../components/ApiReference"), {
  ssr: false
});

export const revalidate = 60;

export default function ApiReferencePage({ params }) {
  const dictionary = getDictionary(params.locale);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{dictionary.apiReferenceTitle}</h1>
      <ApiReference specUrl="/openapi.json" />
    </div>
  );
}
