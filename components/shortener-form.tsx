"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ShortenerForm() {
  const [longUrl, setLongUrl] = React.useState("");
  const [mockResult, setMockResult] = React.useState<null | {
    shortUrl: string;
    clicks: number;
  }>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mock shortened URL result
    setMockResult({
      shortUrl: `https://sho.rt/${Math.random().toString(36).slice(2, 8)}`,
      clicks: Math.floor(Math.random() * 500),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shorten a URL</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            placeholder="Enter a long URL, e.g. https://example.com/some/long/path"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit">Shorten</Button>
          </div>
        </form>

        {mockResult && (
          <div className="mt-6">
            <div className="text-sm text-muted-foreground">Mock result</div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="font-mono bg-background p-2 rounded">
                {mockResult.shortUrl}
              </div>
              <div className="text-sm">
                Clicks: <strong>{mockResult.clicks}</strong>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Logged-in analytics are coming soon.
        </div>
      </CardFooter>
    </Card>
  );
}
