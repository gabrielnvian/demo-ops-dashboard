import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Ops Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          A job-orders tracker for small service businesses. Built with Next.js
          14, Prisma, shadcn/ui, and NextAuth.js.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/api/auth/signin"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Sign In
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-8">
          Scaffold only — auth, data table, and forms are next steps. See README.
        </p>
      </div>
    </main>
  );
}
