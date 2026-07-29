import { getAdminTestsCatalog, getAdminBooks } from "@/app/actions/admin";
import AdminTestsControl from "@/components/admin/AdminTestsControl";

export const dynamic = "force-dynamic";

export default async function AdminTestsPage() {
  const tests = await getAdminTestsCatalog();
  const books = await getAdminBooks();

  // Sort tests by book title and then test title
  tests.sort((a, b) => {
    const bookCompare = a.bookTitle.localeCompare(b.bookTitle);
    if (bookCompare !== 0) return bookCompare;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
          Quản lý Đề thi & Danh mục
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Tạo sách đề (Book), đề thi thử (Test), và quản lý hệ thống dữ liệu câu hỏi.
        </p>
      </div>

      <AdminTestsControl initialTests={tests} books={books} />
    </div>
  );
}
