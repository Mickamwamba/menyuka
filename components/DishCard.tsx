"use client";

import { Card } from "./ui";
import type { ItemTranslation, MenuItem } from "@/lib/types";

export function dishView(item: MenuItem, translation?: ItemTranslation) {
  const translatedName = translation?.name?.trim();
  const showOriginal = Boolean(translatedName) && translatedName !== item.name;
  return {
    heading: translatedName || item.name,
    original: showOriginal ? item.name : null,
    blurb: translation?.blurb?.trim() || item.originalDescription || null,
    price: item.price,
  };
}

export function DishCard({
  item,
  translation,
  onClick,
}: {
  item: MenuItem;
  translation?: ItemTranslation;
  onClick?: () => void;
}) {
  const view = dishView(item, translation);
  return (
    <Card onClick={onClick}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[1.05rem] leading-snug font-semibold text-balance">
          {view.heading}
        </span>
        {view.price ? (
          <span className="shrink-0 text-[0.95rem] font-medium text-muted tabular-nums">
            {view.price}
          </span>
        ) : null}
      </div>
      {view.original ? (
        <p className="mt-0.5 text-[0.85rem] text-faint">{view.original}</p>
      ) : null}
      {view.blurb ? (
        <p className="mt-2 text-[0.92rem] leading-snug text-muted">{view.blurb}</p>
      ) : null}
    </Card>
  );
}
