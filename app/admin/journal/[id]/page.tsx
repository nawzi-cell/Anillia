import { PageHeader } from "@/components/admin/PageHeader";
import { JournalArticleForm } from "@/components/admin/JournalArticleForm";

export const dynamic = "force-dynamic";

export default function AdminEditJournalArticlePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <PageHeader
        title="Edit article"
        description="Update Journal content and publishing settings."
      />
      <JournalArticleForm articleId={params.id} />
    </>
  );
}
