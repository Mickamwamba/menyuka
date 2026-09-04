"use client";

import { useState } from "react";
import { ErrorNote, Screen, Subtitle, Title } from "../ui";
import { prepareImage, type PreparedImage } from "@/lib/image";

/**
 * The two controls are <label>s, not buttons. iOS Safari refuses to open a
 * file picker from a programmatic .click() on a display:none input, so the
 * inputs stay in the layout (sr-only) and the label activates them natively —
 * no JS in the path at all.
 */
const CONTROL =
  "flex w-full min-h-14 items-center justify-center rounded-2xl px-5 text-[1.05rem] font-medium transition active:scale-[0.99] cursor-pointer";

export function UploadScreen({
  onReady,
}: {
  onReady: (images: PreparedImage[]) => void;
}) {
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

        <div className={`mt-8 space-y-3 ${busy ? "pointer-events-none opacity-50" : ""}`}>
          <label htmlFor="menyuka-camera" className={`${CONTROL} bg-accent text-white shadow-sm`}>
            {busy ? "Preparing…" : "Take a photo"}
          </label>
          <label
            htmlFor="menyuka-library"
            className={`${CONTROL} border border-line bg-surface text-ink`}
          >
            Choose from photos
          </label>
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
          id="menyuka-camera"
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <input
          id="menyuka-library"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </Screen>
  );
}
