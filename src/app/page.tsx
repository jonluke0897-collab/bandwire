import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold font-logo text-primary mb-4">
          Bandwire
        </h1>
        <p className="text-xl text-text-muted mb-8">
          Find your next act. Book them in minutes.
        </p>
        <p className="text-sm text-text-muted mb-10 max-w-md mx-auto">
          The booking platform for independent venues and musicians.
          Post open dates, discover talent, send offers, and confirm
          gigs — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-md border border-border px-8 py-3 text-base font-semibold text-text-primary transition-all hover:bg-surface-hover"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
