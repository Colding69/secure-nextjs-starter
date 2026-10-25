import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { can } from "@/lib/rbac";
import { getSession, roleOf } from "@/lib/session";
import { updateRole } from "./actions";

export const metadata = { title: "Admin" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!can(roleOf(session.user), "admin:read")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .orderBy(user.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Role changes are authorized server-side and written to the audit log.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-md border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {params.error === "self"
            ? "You cannot change your own role."
            : "Invalid role change."}
        </p>
      ) : null}
      {params.ok ? (
        <p className="rounded-md border border-emerald-900 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-300">
          Role updated.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/70 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{entry.name}</div>
                  <div className="text-xs text-zinc-400">{entry.email}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-emerald-400">
                  {entry.role}
                </td>
                <td className="px-4 py-3">
                  <form action={updateRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={entry.id} />
                    <select
                      name="role"
                      defaultValue={entry.role}
                      className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
                    >
                      <option value="viewer">viewer</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-700 px-2 py-1 text-xs hover:border-zinc-500"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
