"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, BarChart3 } from "lucide-react";
import QrPreview from "@/components/qr-preview";
import Link from "next/link";

const formSchema = z.object({
  url: z.string().url("Bitte gib eine gültige URL ein"),
  customCode: z
    .string()
    .min(3, "Mindestens 3 Zeichen")
    .max(20, "Maximal 20 Zeichen")
    .optional()
    .or(z.literal("")),
  title: z.string().max(100).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UrlShortenerProps {
  user: User | null;
  onSuccess?: (newUrl: {
    shortUrl: string;
    shortCode: string;
    originalUrl: string;
  }) => void;
}

export default function UrlShortener({ user, onSuccess }: UrlShortenerProps) {
  const [result, setResult] = useState<{
    shortUrl: string;
    shortCode: string;
    originalUrl: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      customCode: "",
      title: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: data.url,
          customCode: data.customCode || undefined,
          title: data.title || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Fehler beim Kürzen der URL");
      }

      setResult(result);
      form.reset();

      // Callback auslösen für Parent-Component
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Ein Fehler ist aufgetreten"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.shortUrl);
      // Hier könntest du einen Toast/Notification zeigen
      alert("URL kopiert!");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>URL verkürzen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="url" className="pb-2">
                Die URL die du kürzen möchtest *
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://beispiel.com/sehr-lange-url"
                {...form.register("url")}
                className="mt-1"
              />
              {form.formState.errors.url && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customCode" className="pb-2">
                Custom Code (optional)
              </Label>
              <Input
                id="customCode"
                placeholder="mein-code"
                {...form.register("customCode")}
                className="mt-1"
              />
              <p className="text-gray-500 text-sm mt-1">
                Leer lassen für automatischen Code
              </p>
              {form.formState.errors.customCode && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.customCode.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title" className="pb-2">
                Titel (optional)
              </Label>
              <Input
                id="title"
                placeholder="Beschreibender Titel"
                {...form.register("title")}
                className="mt-1"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Wird gekürzt..." : "URL kürzen"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">
              ✓ URL erfolgreich gekürzt!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={result.shortUrl} readOnly className="flex-1" />
              <Button onClick={copyToClipboard} size="sm" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {user && (
              <div className="text-center pt-2">
                <Button asChild variant="outline">
                  <Link href={`/analytics/${result.shortCode}`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics anzeigen
                  </Link>
                </Button>
              </div>
            )}

            {/* QR Preview + Download */}
            <div className="pt-2">
              <QrPreview
                text={`${process.env.NEXT_PUBLIC_BASE_URL}/${result.shortCode}`}
                size={280}
                filenameBase={result.shortCode}
              />
            </div>

            {!user && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
                <p className="text-sm">
                  <Link href="/auth" className="font-semibold underline">
                    Melde dich an
                  </Link>
                  , um Analytics für deine Links zu sehen
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
