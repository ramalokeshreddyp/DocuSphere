import { redirect } from "next/navigation";

export default function LocaleHome({ params }) {
  redirect(`/${params.locale}/docs/v1/introduction`);
}
