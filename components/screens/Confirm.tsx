"use client";

import { useEffect, useState } from "react";
import { Button, ErrorNote, Screen, Spinner, Subtitle, Title, TopBar } from "../ui";
import type { Copy } from "@/lib/copy";
import type { ExtractedMenu, Translation } from "@/lib/types";

const STAGES = [
  "Reading the photo…",
  "Finding the dishes…",
  "Working out what each one is…",
  "Almost there…",
];

/** Never a blank wait — the stage text advances even while one call is in flight. [M-14] */
function Progress() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setStage((current) => Math.min(current + 1, STAGES.length - 1)),
      2600,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 text-center">
      <Spinner />
      <p className="text-[1.05rem] font-medium">{STAGES[stage]}</p>
      <p className="max-w-[16rem] text-[0.9rem] text-muted">
        This takes a few seconds on a busy connection.
      </p>
    </div>
  );
}

export function ConfirmScreen({
  copy,
  menu,
  translation,
  loading,
  error,
  languageButton,
  onRetry,
  onRetake,
  onContinue,
}: {
  copy: Copy;
  menu: ExtractedMenu | null;
  translation: Translation | null;
  loading: boolean;
  error: string | null;
  languageButton: React.ReactNode;
  onRetry: () => void;
  onRetake: () => void;
  onContinue: () => void;
}) {
  if (loading || (!menu && !error)) {
    return (
      <Screen>
        <TopBar right={languageButton} />
        <Progress />
      </Screen>
    );
  }

  if (error || !menu) {
    return (
      <Screen>
        <TopBar right={languageButton} />
        <div className="mt-10">
          <Title>That didn&apos;t work.</Title>
          <div className="mt-5 space-y-3">
            <ErrorNote message={error ?? "We couldn't read that menu."} onRetry={onRetry} />
            <Button variant="secondary" onClick={onRetake}>
              {copy.t("confirmRetake")}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <div className="space-y-2 pb-1">
          <Button onClick={onContinue}>{copy.t("confirmContinue")}</Button>
          <Button variant="quiet" onClick={onRetake}>
            {copy.t("confirmRetake")}
          </Button>
        </div>
      }
    >
      <TopBar right={languageButton} />
      <div className="rise">
        <Title>{copy.t("confirmTitle")}</Title>
        <Subtitle>{copy.t("confirmSubtitle")}</Subtitle>
        <p className="mt-3 text-[0.85rem] font-medium text-accent">
          {menu.items.length} {copy.t("confirmCount")}
          {menu.restaurantName ? ` · ${menu.restaurantName}` : ""}
        </p>
      </div>

      {/*
        Names are shown as printed, in the menu's own script — the diner is
        checking them against the paper in front of them, not reading them.
      */}
      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {menu.items.map((item) => {
          const translated = translation?.items[item.id]?.name;
          return (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.98rem] leading-snug font-medium">
                  {item.name}
                </span>
                {item.price ? (
                  <span className="shrink-0 text-[0.88rem] text-faint tabular-nums">
                    {item.price}
                  </span>
                ) : null}
              </div>
              {translated && translated !== item.name ? (
                <p className="mt-0.5 text-[0.85rem] text-muted">{translated}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
