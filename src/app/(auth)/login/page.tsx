import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-400">
          Run the seed script once to create demo accounts; it prints their credentials.
        </p>
        <LoginForm nextPath={nextPath} />
      </div>
      <Link href="/" className="mt-6 text-center text-sm text-zinc-400 hover:text-zinc-200">
        ← Back to overview
      </Link>
    </main>
  );
}
