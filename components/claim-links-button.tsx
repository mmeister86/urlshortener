"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Link } from "lucide-react";

interface ClaimLinksButtonProps {
  onLinksClaimed?: (count: number) => void;
}

export default function ClaimLinksButton({
  onLinksClaimed,
}: ClaimLinksButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    claimed: number;
    links: Array<{ shortCode: string; originalUrl: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaimLinks = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get current client session to send to claim API
      const clientSession = await fetch("/api/session")
        .then((res) => res.json())
        .catch(() => null);

      const response = await fetch("/api/claim-session-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: clientSession?.anonymousId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Übernehmen der Links");
      }

      const data = await response.json();
      setResult(data);

      if (onLinksClaimed) {
        onLinksClaimed(data.claimed);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show anything if we already processed the claim
  if (result && result.claimed === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5 text-blue-600" />
          Links zu deinem Account hinzufügen
        </CardTitle>
        <CardDescription>
          Du hast Links erstellt, bevor du dich angemeldet hast. Möchtest du sie
          zu deinem Account hinzufügen?
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {result && result.claimed > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {result.claimed} Links erfolgreich hinzugefügt!
              </span>
            </div>
            {result.links.length > 0 && (
              <div className="text-xs text-gray-600">
                {result.links.map((link, index) => (
                  <div key={index} className="truncate">
                    /{link.shortCode} → {link.originalUrl}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!result && (
          <Button
            onClick={handleClaimLinks}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Übernehme Links..." : "Links zu Account hinzufügen"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
