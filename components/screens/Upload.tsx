"use client";

import { useRef, useState } from "react";
import { Button, ErrorNote, Screen, Subtitle, Title } from "../ui";
import { prepareImage, type PreparedImage } from "@/lib/image";

export function UploadScreen({
  onReady,
}: {
  onReady: (images: PreparedImage[]) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const files = Array.from(list).slice(0, 4);
      const images = await Promise.all(files.map(prepareImage));
      onReady(images);
    } catch {
      setError("We couldn't read that image. Try another photo.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <div className="flex min-h-[80dvh] flex-col justify-center">
        <div className="rise">
          <p className="text-[0.8rem] font-semibold tracking-[0.18em] text-accent uppercase">
            Menyuka
          </p>
          <Title>Photograph the menu.</Title>
          <Subtitle>
            No account, no app. We&apos;ll read it, then either translate the whole
            thing or narrow it down to a few dishes for you.
          </Subtitle>
        </div>

        <div className="mt-8 space-y-3">
          <Button onClick={() => cameraRef.current?.click()} disabled={busy}>
            {busy ? "Preparing…" : "Take a photo"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            Choose from photos
          </Button>
          <p className="pt-1 text-center text-[0.85rem] text-faint">
            Multi-page menu? Select up to 4 pages at once.
          </p>
        </div>

        {error ? (
          <div className="mt-6">
            <ErrorNote message={error} />
          </div>
        ) : null}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </Screen>
  );
}
