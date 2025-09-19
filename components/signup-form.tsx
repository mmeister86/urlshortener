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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Passwort-Validierung
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Registrierung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✓ Registrierung erfolgreich!</CardTitle>
            <CardDescription>
              Wir haben dir eine Bestätigungs-E-Mail gesendet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Bitte überprüfe deine E-Mails und klicke auf den Bestätigungslink, 
                um dein Konto zu aktivieren.
              </p>
              <Button 
                onClick={() => router.push("/anmelden")} 
                className="w-full"
              >
                Zur Anmeldung
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
          <CardDescription>
            Gib deine E-Mail-Adresse ein, um ein Konto zu erstellen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
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
              <div className="grid gap-3">
                <Label htmlFor="password">Passwort</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Wird erstellt..." : "Konto erstellen"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Bereits ein Konto?{" "}
              <a href="/anmelden" className="underline underline-offset-4">
                Anmelden
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

