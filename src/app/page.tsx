import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950">
      <section className="mx-auto grid max-w-4xl gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Agile AI Workspaces</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Workspace management console for NV3.
          </p>
        </div>
        <Link
          className="flex h-11 w-fit items-center bg-zinc-900 px-5 text-sm font-semibold text-white"
          href="/workspaces"
        >
          Open workspaces
        </Link>
      </section>
    </main>
  );
}
