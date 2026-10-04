import { PageHeader } from "@/components/admin/PageHeader";
import { JournalArticleForm } from "@/components/admin/JournalArticleForm";

export const dynamic = "force-dynamic";

export default function AdminNewJournalArticlePage() {
  return (
    <>
      <PageHeader
        title="New article"
        description="Add a styling note, guide, or editorial story to the public Journal."
      />
      <JournalArticleForm />
    </>
  );
}
