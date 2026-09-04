"use client";

import { useState } from "react";
import { BackButton, Screen, TopBar } from "../ui";
import { dishView } from "../DishCard";
import type { Copy } from "@/lib/copy";
import type { ExtractedMenu, MenuItem, Translation } from "@/lib/types";

export function ShowServerScreen({
  copy,
  menu,
  item,
  translation,
  onBack,
}: {
  copy: Copy;
  menu: ExtractedMenu;
  item: MenuItem;
  translation: Translation | null;
  onBack: () => void;
}) {
  // The phone gets turned around, not the person — so the card can turn instead.
  const [flipped, setFlipped] = useState(false);
  const view = dishView(item, translation?.items[item.id]);

  return (
    <Screen
      footer={
        <div className="flex gap-2 pb-1">
          <button
            type="button"
            onClick={() => setFlipped((current) => !current)}
            className="min-h-14 flex-1 rounded-2xl border border-line bg-surface text-[1rem] font-medium"
          >
            {flipped ? "Turn back to me ↻" : "Turn it around ↻"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="min-h-14 flex-1 rounded-2xl bg-accent text-[1rem] font-medium text-white"
          >
            {copy.t("serverDone")}
          </button>
        </div>
      }
    >
      <TopBar left={<BackButton label={copy.t("back")} onClick={onBack} />} />

      <div
        className={`rounded-3xl border border-line bg-surface p-6 transition-transform duration-300 ${
          flipped ? "rotate-180" : ""
        }`}
      >
        <p className="text-[0.72rem] font-semibold tracking-[0.16em] text-accent uppercase">
          {copy.t("serverTitle")}
        </p>

        {/* The printed name in the menu's own script is what the server reads. */}
        <p className="mt-4 text-[2.1rem] leading-[1.15] font-semibold tracking-tight text-balance">
          {item.name}
        </p>

        {item.category ? (
          <p className="mt-2 text-[1rem] text-muted">{item.category}</p>
        ) : null}
        {item.price ? (
          <p className="mt-1 text-[1.25rem] font-medium tabular-nums">{item.price}</p>
        ) : null}

        {menu.serverPhrase ? (
          <p className="mt-6 border-t border-line pt-5 text-[1.35rem] leading-snug text-balance">
            {menu.serverPhrase}
          </p>
        ) : null}
      </div>

      {/* Kept outside the flipped card: this half is for the diner, not the server. */}
      {view.original ? (
        <p className="mt-4 px-1 text-[0.9rem] text-faint">{view.heading}</p>
      ) : null}
      {view.blurb ? (
        <p className="mt-1 px-1 text-[0.9rem] leading-snug text-muted">{view.blurb}</p>
      ) : null}
    </Screen>
  );
}
