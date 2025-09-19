"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearSessionCache } from "@/lib/session-client";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Clear session cache after login
      clearSessionCache();

      // Claim any anonymous session links after successful login
      try {
        // Get current client session to send to claim API
        const clientSession = await fetch("/api/session")
          .then((res) => res.json())
          .catch(() => null);

        const claimResponse = await fetch("/api/claim-session-links", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: clientSession?.anonymousId,
          }),
        });

        if (claimResponse.ok) {
          const claimResult = await claimResponse.json();
          console.log("🔗 Session links claimed:", claimResult);

          if (claimResult.claimed > 0) {
            // Optional: Show user notification about claimed links
            console.log(
              `✅ ${claimResult.claimed} Links zu deinem Account hinzugefügt!`
            );
          }
        }
      } catch (claimError) {
        console.warn("Failed to claim session links:", claimError);
        // Don't block login flow if claiming fails
      }

      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${
            process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
          }/dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      alert("Magic Link wurde an deine E-Mail-Adresse gesendet!");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Magic Link konnte nicht gesendet werden"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Bei deinem Konto anmelden</CardTitle>
          <CardDescription>
            Gib deine E-Mail-Adresse und dein Passwort ein
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={showMagicLink ? handleMagicLink : handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {!showMagicLink && (
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Passwort</Label>
                    <button
                      type="button"
                      onClick={() => setShowMagicLink(true)}
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Magic Link verwenden
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {showMagicLink && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Wir senden dir einen Magic Link an deine E-Mail-Adresse.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMagicLink(false)}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Zurück zur Passwort-Anmeldung
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading
                  ? "Wird geladen..."
                  : showMagicLink
                  ? "Magic Link senden"
                  : "Anmelden"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Noch kein Konto?{" "}
              <Link
                href="/registrieren"
                className="underline underline-offset-4"
              >
                Registrieren
              </Link>
            </div>
            <div className="mt-4 text-center text-sm">
              <Link href="/">Zurück zur Startseite</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
