import Header from "../../components/Header";
import { getDictionary } from "../../lib/i18n";

export default function LocaleLayout({ children, params }) {
  const dictionary = getDictionary(params.locale);

  return (
    <div className="min-h-screen">
      <Header locale={params.locale} dictionary={dictionary} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
