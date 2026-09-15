import type { Metadata } from "next";
import { safeNext } from "@/lib/auth/protected-paths";
import { LoginCardConnected } from "@/components/auth/LoginCardConnected";

export const metadata: Metadata = {
  title: "התחברות",
  robots: { index: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const next = safeNext(searchParams.next);
  const error = searchParams.error;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-bold text-foreground">התחברות</h1>
      <LoginCardConnected next={next} error={error} />
    </div>
  );
}
