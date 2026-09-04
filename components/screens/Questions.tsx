"use client";

import { BackButton, Button, Card, Screen, Title, TopBar } from "../ui";
import type { Copy } from "@/lib/copy";
import { MAX_QUESTIONS } from "@/lib/questions";
import type { Question } from "@/lib/types";

export function QuestionScreen({
  copy,
  question,
  step,
  totalSteps,
  languageButton,
  onAnswer,
  onBack,
  onSkip,
}: {
  copy: Copy;
  question: Question;
  step: number;
  totalSteps: number;
  languageButton: React.ReactNode;
  onAnswer: (value: string) => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const steps = Math.min(Math.max(totalSteps, step), MAX_QUESTIONS);

  return (
    <Screen
      footer={
        <div className="pb-1">
          <Button variant="quiet" onClick={onSkip}>
            {copy.t("skipQuestions")}
          </Button>
        </div>
      }
    >
      <TopBar left={<BackButton label={copy.t("back")} onClick={onBack} />} right={languageButton} />

      <div className="mb-6 flex gap-1.5" aria-hidden>
        {Array.from({ length: steps }, (_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index < step ? "bg-accent" : "bg-line"
            }`}
          />
        ))}
      </div>

      {/* key resets the entrance animation so each question feels like a new card */}
      <div key={question.axis} className="rise">
        <Title>{copy.question(question.axis)}</Title>

        <div className="mt-6 space-y-2.5">
          {question.options.map((option) => (
            <Card key={option.value} onClick={() => onAnswer(option.value)}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[1.1rem] font-medium">
                  {copy.option(question.axis, option.value)}
                </span>
                <span className="shrink-0 text-[0.85rem] text-faint tabular-nums">
                  {option.count}
                </span>
              </div>
            </Card>
          ))}
          {/* Always available, so no answer combination can strand the diner. */}
          <Card onClick={() => onAnswer("any")}>
            <span className="text-[1.1rem] font-medium text-muted">
              {copy.t("noPreference")}
            </span>
          </Card>
        </div>
      </div>
    </Screen>
  );
}
