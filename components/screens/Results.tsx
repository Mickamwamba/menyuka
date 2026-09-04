"use client";

import { Button, Screen, Subtitle, Title, TopBar } from "../ui";
import { DishCard } from "../DishCard";
import type { Copy } from "@/lib/copy";
import type { ResultSet } from "@/lib/questions";
import type { MenuItem, Translation } from "@/lib/types";

export function ResultsScreen({
  copy,
  results,
  translation,
  languageButton,
  onShuffle,
  onStartOver,
  onPick,
}: {
  copy: Copy;
  results: ResultSet;
  translation: Translation | null;
  languageButton: React.ReactNode;
  onShuffle: () => void;
  onStartOver: () => void;
  onPick: (item: MenuItem) => void;
}) {
  return (
    <Screen
      footer={
        <div className="space-y-2 pb-1">
          {results.hasAlternates ? (
            <Button variant="secondary" onClick={onShuffle}>
              {copy.t("shuffle")}
            </Button>
          ) : null}
          <Button variant="quiet" onClick={onStartOver}>
            {copy.t("startOver")}
          </Button>
        </div>
      }
    >
      <TopBar right={languageButton} />
      <div className="rise">
        <Title>{copy.t("resultsTitle")}</Title>
        {/* Closest-match fallback rather than a dead end. [M-16] */}
        {results.isApproximate ? <Subtitle>{copy.t("resultsApprox")}</Subtitle> : null}
      </div>

      <div className="mt-6 space-y-2.5">
        {results.items.map((item) => (
          <DishCard
            key={item.id}
            item={item}
            translation={translation?.items[item.id]}
            onClick={() => onPick(item)}
          />
        ))}
      </div>
    </Screen>
  );
}
