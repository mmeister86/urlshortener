"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BarChart3, ExternalLink, Calendar, Trash2, Edit3 } from "lucide-react";
import { QrCode } from "lucide-react";
import QrPreview from "@/components/qr-preview";
import { truncateUrl } from "@/lib/utils";

interface Click {
  id: string;
  url_id: string;
  created_at: string;
  user_agent: string | null;
  referer: string | null;
  ip_address: string | null;
}

interface UrlWithClicks {
  id: string;
  user_id: string | null; // Can be null for anonymous links
  session_id: string | null; // New field
  original_url: string;
  short_code: string;
  custom_code: string | null;
  title: string | null;
  description: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at?: string;
  clicks: Click[];
}

interface UrlsListProps {
  urls: UrlWithClicks[];
  isLoading: boolean;
  onUrlDeleted?: (urlId: string) => void;
  onUrlUpdated?: (urlId: string, updatedUrl: UrlWithClicks) => void;
}

export default function UrlsList({
  urls,
  isLoading,
  onUrlDeleted,
  onUrlUpdated,
}: UrlsListProps) {
  const [deletingUrls, setDeletingUrls] = useState<Set<string>>(new Set());
  const [editingUrl, setEditingUrl] = useState<UrlWithClicks | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<UrlWithClicks | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    original_url: "",
    title: "",
    description: "",
    expires_at: "",
  });

  const handleDeleteUrl = async (url: UrlWithClicks) => {
    if (deletingUrls.has(url.id)) return;

    setDeletingUrls((prev) => new Set([...prev, url.id]));

    try {
      const shortCode = url.custom_code || url.short_code;
      const response = await fetch(`/api/delete/${shortCode}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Löschen");
      }

      // Notify parent component about successful deletion
      onUrlDeleted?.(url.id);
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error instanceof Error ? error.message : "Fehler beim Löschen der URL"
      );
    } finally {
      setDeletingUrls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url.id);
        return newSet;
      });
    }
  };

  const handleEditUrl = (url: UrlWithClicks) => {
    setEditingUrl(url);
    setEditForm({
      original_url: url.original_url,
      title: url.title || "",
      description: url.description || "",
      expires_at: url.expires_at ? url.expires_at.split("T")[0] : "", // Format für date input
    });
  };

  const handleUpdateUrl = async () => {
    if (!editingUrl) return;

    setIsUpdating(true);

    try {
      const shortCode = editingUrl.custom_code || editingUrl.short_code;

      // Bereite Update-Daten vor (nur nicht-leere Felder senden)
      const updateData: {
        original_url?: string;
        title?: string | null;
        description?: string | null;
        expires_at?: string | null;
      } = {};

      if (
        editForm.original_url &&
        editForm.original_url !== editingUrl.original_url
      ) {
        updateData.original_url = editForm.original_url;
      }

      if (editForm.title !== (editingUrl.title || "")) {
        updateData.title = editForm.title || null;
      }

      if (editForm.description !== (editingUrl.description || "")) {
        updateData.description = editForm.description || null;
      }

      if (
        editForm.expires_at !==
        (editingUrl.expires_at ? editingUrl.expires_at.split("T")[0] : "")
      ) {
        updateData.expires_at = editForm.expires_at
          ? `${editForm.expires_at}T23:59:59.999Z`
          : null;
      }

      // Nur updaten wenn sich etwas geändert hat
      if (Object.keys(updateData).length === 0) {
        setEditingUrl(null);
        setIsUpdating(false);
        return;
      }

      const response = await fetch(`/api/update/${shortCode}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Aktualisieren");
      }

      const result = await response.json();

      // Notify parent component about successful update
      const updatedUrl = {
        ...editingUrl,
        original_url: result.url.original_url,
        title: result.url.title,
        description: result.url.description,
        expires_at: result.url.expires_at,
        updated_at: result.url.updated_at,
      };

      onUrlUpdated?.(editingUrl.id, updatedUrl);
      setEditingUrl(null);
    } catch (error) {
      console.error("Update error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Fehler beim Aktualisieren der URL"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">URLs werden geladen...</div>
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-xl font-semibold mb-4">
            Noch keine Links erstellt
          </h3>
          <p className="text-gray-600">
            Verwende das Formular oben, um deinen ersten kurzen Link zu
            erstellen
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {urls.map((url) => (
        <Card key={url.id}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">
                  {url.title || truncateUrl(url.original_url)}
                </CardTitle>
                <p className="text-sm text-gray-500 truncate">
                  {truncateUrl(url.original_url)}
                </p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 sm:ml-4 sm:shrink-0">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  title="Link öffnen"
                  className="shrink-0 px-2 sm:px-3"
                >
                  <a
                    href={`${process.env.NEXT_PUBLIC_BASE_URL}/${
                      url.custom_code || url.short_code
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  title="Analytics-Dashboard"
                  className="shrink-0 px-2 sm:px-3"
                >
                  <Link
                    href={`/analytics/${url.custom_code || url.short_code}`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Analytics</span>
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQrPreviewUrl(url)}
                  title="QR anzeigen"
                  className="shrink-0 px-2 sm:px-3"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditUrl(url)}
                  className="cursor-pointer shrink-0 px-2 sm:px-3"
                  title="Link bearbeiten"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingUrls.has(url.id)}
                      className="cursor-pointer shrink-0 px-2 sm:px-3"
                      title="URL löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingUrls.has(url.id) && (
                        <span className="hidden sm:inline">...</span>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="py-8">
                    <AlertDialogHeader className="py-4">
                      <AlertDialogTitle>URL löschen</AlertDialogTitle>
                      <AlertDialogDescription className="py-4">
                        Möchtest du die URL &ldquo;
                        <span className="font-mono font-semibold">
                          /{url.custom_code || url.short_code}
                        </span>
                        &rdquo; wirklich löschen?
                        <br />
                        <br />
                        Diese Aktion kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="py-4">
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteUrl(url)}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  /{url.custom_code || url.short_code}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(url.created_at).toLocaleDateString("de-DE")}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {url.clicks?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Klicks</p>
              </div>
            </div>
            {/* Inline-QR entfernt zu Gunsten eines Modals */}
          </CardContent>
        </Card>
      ))}

      {/* Edit Modal */}
      <AlertDialog open={!!editingUrl} onOpenChange={() => setEditingUrl(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>URL bearbeiten</AlertDialogTitle>
            <AlertDialogDescription>
              Bearbeite die Details deiner Kurz-URL. Der Short Code kann nicht
              geändert werden.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {editingUrl && (
            <div className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="short-code"
                  className="text-right font-semibold"
                >
                  Short Code
                </Label>
                <div className="col-span-3">
                  <span className="font-mono bg-gray-100 px-3 py-2 rounded border text-gray-700">
                    /{editingUrl.custom_code || editingUrl.short_code}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Short Code kann nicht geändert werden
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="original-url" className="text-right">
                  Ziel-URL *
                </Label>
                <Input
                  id="original-url"
                  type="url"
                  placeholder="https://example.com"
                  value={editForm.original_url}
                  onChange={(e) =>
                    setEditForm({ ...editForm, original_url: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Titel
                </Label>
                <Input
                  id="title"
                  placeholder="Optionaler Titel für bessere Organisation"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="col-span-3"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Beschreibung
                </Label>
                <Input
                  id="description"
                  placeholder="Optionale Beschreibung"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="col-span-3"
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expires-at" className="text-right">
                  Ablaufdatum
                </Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={editForm.expires_at}
                  onChange={(e) =>
                    setEditForm({ ...editForm, expires_at: e.target.value })
                  }
                  className="col-span-3"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateUrl}
              disabled={isUpdating || !editForm.original_url}
            >
              {isUpdating ? "Wird gespeichert..." : "Speichern"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Preview Modal */}
      <AlertDialog
        open={!!qrPreviewUrl}
        onOpenChange={() => setQrPreviewUrl(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>QR Code</AlertDialogTitle>
            <AlertDialogDescription>
              QR Code für diese Kurz-URL (herunterladen als PNG oder SVG)
            </AlertDialogDescription>
          </AlertDialogHeader>

          {qrPreviewUrl && (
            <div className="py-4 flex justify-center">
              <QrPreview
                text={`${process.env.NEXT_PUBLIC_BASE_URL}/${
                  qrPreviewUrl.custom_code || qrPreviewUrl.short_code
                }`}
                size={440}
                filenameBase={
                  qrPreviewUrl.custom_code || qrPreviewUrl.short_code
                }
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Schließen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
