"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Globe, AlertCircle } from "lucide-react";
import Image from "next/image";

export interface UrlMetadata {
  pageTitle?: string;
  pageDescription?: string;
  previewImageUrl?: string;
  faviconUrl?: string;
}

interface UrlPreviewProps {
  metadata: UrlMetadata;
  isLoading?: boolean;
  error?: string | null;
}

export default function UrlPreview({
  metadata,
  isLoading,
  error,
}: UrlPreviewProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="flex gap-4 p-4">
          <div className="h-16 w-16 bg-gray-200 rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mt-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (
    !metadata.pageTitle &&
    !metadata.faviconUrl &&
    !metadata.previewImageUrl
  ) {
    return null;
  }

  const imageUrl = metadata.previewImageUrl || metadata.faviconUrl;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="flex gap-4 p-4">
        {/* Bild oder Platzhalter */}
        <div className="h-16 w-16 shrink-0 flex items-center justify-center bg-white rounded border border-gray-200 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={metadata.pageTitle || "Preview"}
              width={64}
              height={64}
              className="object-cover w-full h-full"
              onError={(e) => {
                // Fallback bei Bildfehler
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <Globe className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Metadaten */}
        <div className="flex-1 min-w-0">
          {metadata.pageTitle && (
            <h4 className="font-semibold text-sm text-gray-900 truncate">
              {metadata.pageTitle}
            </h4>
          )}
          {metadata.pageDescription && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {metadata.pageDescription}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
