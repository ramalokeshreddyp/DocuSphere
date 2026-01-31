import { redirect } from "next/navigation";

export default function DocsVersionPage({ params }) {
  redirect(`/${params.locale}/docs/${params.version}/introduction`);
}
