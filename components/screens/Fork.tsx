"use client";

import { Card, Screen, Title, TopBar } from "../ui";
import type { Copy } from "@/lib/copy";

export function ForkScreen({
  copy,
  languageButton,
  onBrowse,
  onGuide,
}: {
  copy: Copy;
  languageButton: React.ReactNode;
  onBrowse: () => void;
  onGuide: () => void;
}) {
  return (
    <Screen>
      <TopBar right={languageButton} />
      <div className="flex min-h-[74dvh] flex-col justify-center">
        <div className="rise">
          <Title>{copy.t("forkTitle")}</Title>
        </div>
        {/* Deliberately equal weight — neither path is the default. [M-5] */}
        <div className="mt-7 space-y-3">
          <Card onClick={onGuide}>
            <span className="block text-[1.15rem] font-semibold">
              {copy.t("forkHelp")}
            </span>
            <span className="mt-1 block text-[0.92rem] text-muted">
              {copy.t("forkHelpSub")}
            </span>
          </Card>
          <Card onClick={onBrowse}>
            <span className="block text-[1.15rem] font-semibold">
              {copy.t("forkBrowse")}
            </span>
            <span className="mt-1 block text-[0.92rem] text-muted">
              {copy.t("forkBrowseSub")}
            </span>
          </Card>
        </div>
      </div>
    </Screen>
  );
}
