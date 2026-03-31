import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <SignIn />
        <noscript>
          <p className="text-text-muted mt-4">JavaScript is required to sign in.</p>
        </noscript>
      </div>
    </main>
  );
}
