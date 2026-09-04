"use client";

import { BackButton, Card, Screen, Subtitle, Title, TopBar } from "../ui";
import { LANGUAGES } from "@/lib/copy";

export function LanguageScreen({
  selected,
  onSelect,
  onBack,
}: {
  selected: string | null;
  onSelect: (code: string) => void;
  onBack?: () => void;
}) {
  return (
    <Screen>
      <TopBar left={onBack ? <BackButton label="Back" onClick={onBack} /> : null} />
      <div className="rise">
        <Title>What language do you read?</Title>
        <Subtitle>You can change this at any time.</Subtitle>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {LANGUAGES.map((language) => (
          <Card
            key={language.code}
            selected={selected === language.code}
            onClick={() => onSelect(language.code)}
          >
            <span className="block text-[1.05rem] font-medium">{language.label}</span>
            <span className="mt-0.5 block text-[0.8rem] text-faint">
              {language.english}
            </span>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
