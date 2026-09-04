"use client";

import { BackButton, Screen, Spinner, Title, TopBar } from "../ui";
import { DishCard } from "../DishCard";
import type { Copy } from "@/lib/copy";
import type { MenuItem, Translation } from "@/lib/types";

export function BrowseScreen({
  copy,
  items,
  translation,
  translating,
  languageButton,
  onBack,
  onPick,
}: {
  copy: Copy;
  items: MenuItem[];
  translation: Translation | null;
  translating: boolean;
  languageButton: React.ReactNode;
  onBack: () => void;
  onPick: (item: MenuItem) => void;
}) {
  const groups = groupByCategory(items);

  return (
    <Screen>
      <TopBar left={<BackButton label={copy.t("back")} onClick={onBack} />} right={languageButton} />
      <div className="flex items-center gap-3">
        <Title>{copy.t("browseTitle")}</Title>
        {translating ? <Spinner /> : null}
      </div>

      <div className="mt-5 space-y-7">
        {groups.map(([category, groupItems]) => (
          <section key={category ?? "_"}>
            {category ? (
              <h2 className="mb-2.5 text-[0.78rem] font-semibold tracking-[0.14em] text-faint uppercase">
                {category}
              </h2>
            ) : null}
            <div className="space-y-2.5">
              {groupItems.map((item) => (
                <DishCard
                  key={item.id}
                  item={item}
                  translation={translation?.items[item.id]}
                  onClick={() => onPick(item)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Screen>
  );
}

/** Keeps the menu's own section order rather than sorting alphabetically. */
function groupByCategory(items: MenuItem[]): [string | null, MenuItem[]][] {
  const groups = new Map<string | null, MenuItem[]>();
  for (const item of items) {
    const key = item.category ?? null;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()];
}
