"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { UploadScreen } from "./screens/Upload";
import { LanguageScreen } from "./screens/Language";
import { ConfirmScreen } from "./screens/Confirm";
import { ForkScreen } from "./screens/Fork";
import { BrowseScreen } from "./screens/Browse";
import { QuestionScreen } from "./screens/Questions";
import { ResultsScreen } from "./screens/Results";
import { ShowServerScreen } from "./screens/ShowServer";
import { LANGUAGES, makeCopy } from "@/lib/copy";
import type { PreparedImage } from "@/lib/image";
import {
  applyAnswers,
  buildResults,
  estimateQuestionCount,
  selectQuestion,
} from "@/lib/questions";
import {
  clearSession,
  EMPTY_SESSION,
  loadSession,
  saveSession,
  type StoredSession,
} from "@/lib/session";
import type { Answer, ExtractedMenu, MenuItem, Translation } from "@/lib/types";

type ScreenName =
  | "upload"
  | "language"
  | "confirm"
  | "fork"
  | "browse"
  | "questions"
  | "results"
  | "server";

const noopSubscribe = () => () => {};

/**
 * sessionStorage can only be read on the client, and reading it during
 * hydration would mismatch the server HTML. So the upload screen renders
 * immediately from empty state, and a stored session — which almost never
 * exists — remounts the app once hydration is done. Nobody waits on JS to see
 * a first screen.
 */
export function MenyukaApp() {
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return (
    <MenyukaSession
      key={mounted ? "client" : "server"}
      initial={mounted ? loadSession() : EMPTY_SESSION}
    />
  );
}

function MenyukaSession({ initial }: { initial: StoredSession }) {
  const [screen, setScreen] = useState<ScreenName>(() => {
    if (!initial.menu) return "upload";
    // Answers aren't persisted, so a reload lands back on confirmation.
    return initial.languageCode ? "confirm" : "language";
  });
  /** Where the persistent language toggle should return to. */
  const [returnTo, setReturnTo] = useState<ScreenName | null>(null);

  const [images, setImages] = useState<PreparedImage[]>([]);
  const [menu, setMenu] = useState<ExtractedMenu | null>(initial.menu);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [languageCode, setLanguageCode] = useState<string | null>(initial.languageCode);
  const [translations, setTranslations] = useState<Record<string, Translation>>(
    initial.translations,
  );
  const [translateFailed, setTranslateFailed] = useState<Record<string, boolean>>({});
  /** Codes already requested for the current menu, so effects don't re-fire. */
  const requested = useRef(new Set(Object.keys(initial.translations)));

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState<MenuItem | null>(null);

  useEffect(() => {
    saveSession({ menu, languageCode, translations });
  }, [menu, languageCode, translations]);

  const language = LANGUAGES.find((entry) => entry.code === languageCode) ?? null;
  const translation = languageCode ? (translations[languageCode] ?? null) : null;
  const copy = useMemo(() => makeCopy(translation?.ui ?? null), [translation]);

  const translating = Boolean(
    menu && language && !translations[language.code] && !translateFailed[language.code],
  );

  const runExtraction = useCallback(async (payload: PreparedImage[]) => {
    setExtracting(true);
    setExtractError(null);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: payload.map(({ media_type, data }) => ({ media_type, data })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "We couldn't read that menu.");
      setMenu(body as ExtractedMenu);
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "We couldn't read that menu.",
      );
    } finally {
      setExtracting(false);
    }
  }, []);

  // Translation is a separate call so the confirmation list can appear as soon
  // as extraction lands, while the wording is still being translated behind it.
  useEffect(() => {
    if (!menu || !language) return;
    const code = language.code;
    if (requested.current.has(code)) return;
    requested.current.add(code);

    let cancelled = false;
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetLanguage: language.english,
        menuLanguage: menu.menuLanguageName,
        items: menu.items.map(({ id, name, originalDescription, category }) => ({
          id,
          name,
          originalDescription,
          category,
        })),
      }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error ?? "translate failed");
        if (!cancelled) setTranslations((current) => ({ ...current, [code]: body }));
      })
      .catch(() => {
        // Untranslated is degraded, not broken — the flow still works in the
        // menu's own language, so this failure stays quiet.
        requested.current.delete(code);
        if (!cancelled) setTranslateFailed((current) => ({ ...current, [code]: true }));
      });

    return () => {
      cancelled = true;
    };
  }, [menu, language]);

  const pool = useMemo(
    () => (menu ? applyAnswers(menu.items, answers) : []),
    [menu, answers],
  );
  const question = useMemo(
    () => (menu ? selectQuestion(pool, answers.map((a) => a.axis)) : null),
    [menu, pool, answers],
  );
  const results = useMemo(
    () => (menu ? buildResults(menu.items, answers, page) : null),
    [menu, answers, page],
  );

  function retake() {
    clearSession();
    setScreen("upload");
    setReturnTo(null);
    setImages([]);
    setMenu(null);
    setExtracting(false);
    setExtractError(null);
    setAnswers([]);
    setPage(0);
    setChosen(null);
    // Item ids are per-menu, so old translations don't survive a new photo —
    // but the chosen language does. The diner already told us that once.
    setTranslations({});
    setTranslateFailed({});
    requested.current = new Set();
  }

  function chooseLanguage(code: string) {
    setLanguageCode(code);
    setScreen(returnTo ?? "confirm");
    setReturnTo(null);
  }

  function startQuestions() {
    setAnswers([]);
    setPage(0);
    setScreen(menu && selectQuestion(menu.items, []) ? "questions" : "results");
  }

  function answerQuestion(value: string) {
    if (!question || !menu) return;
    const next = [...answers, { axis: question.axis, value }];
    const nextQuestion = selectQuestion(
      applyAnswers(menu.items, next),
      next.map((a) => a.axis),
    );
    setAnswers(next);
    setPage(0);
    setScreen(nextQuestion ? "questions" : "results");
  }

  function stepBack() {
    if (answers.length === 0) {
      setScreen("fork");
      return;
    }
    setAnswers(answers.slice(0, -1));
    setScreen("questions");
  }

  function pickDish(item: MenuItem) {
    setChosen(item);
    setScreen("server");
  }

  const languageButton = language ? (
    <button
      type="button"
      onClick={() => {
        setReturnTo(screen);
        setScreen("language");
      }}
      className="flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[0.9rem] font-medium"
    >
      <span aria-hidden>🌐</span>
      {language.label}
    </button>
  ) : null;

  if (screen === "upload") {
    return (
      <UploadScreen
        onReady={(prepared) => {
          setImages(prepared);
          // Extraction runs while the diner picks a language, so the slowest
          // call in the flow happens behind a screen they were going to see
          // anyway. [M-14]
          setScreen("language");
          void runExtraction(prepared);
        }}
      />
    );
  }

  if (screen === "language") {
    return (
      <LanguageScreen
        selected={languageCode}
        onSelect={chooseLanguage}
        onBack={
          returnTo
            ? () => {
                setScreen(returnTo);
                setReturnTo(null);
              }
            : undefined
        }
      />
    );
  }

  if (screen === "confirm" || !menu) {
    return (
      <ConfirmScreen
        copy={copy}
        menu={menu}
        translation={translation}
        loading={extracting}
        error={extractError}
        languageButton={languageButton}
        onRetry={() => void runExtraction(images)}
        onRetake={retake}
        onContinue={() => setScreen("fork")}
      />
    );
  }

  if (screen === "fork") {
    return (
      <ForkScreen
        copy={copy}
        languageButton={languageButton}
        onBrowse={() => setScreen("browse")}
        onGuide={startQuestions}
      />
    );
  }

  if (screen === "browse") {
    return (
      <BrowseScreen
        copy={copy}
        items={menu.items}
        translation={translation}
        translating={translating}
        languageButton={languageButton}
        onBack={() => setScreen("fork")}
        onPick={pickDish}
      />
    );
  }

  if (screen === "questions" && question) {
    return (
      <QuestionScreen
        copy={copy}
        question={question}
        step={answers.length}
        totalSteps={estimateQuestionCount(
          pool,
          answers.map((a) => a.axis),
        )}
        languageButton={languageButton}
        onAnswer={answerQuestion}
        onBack={stepBack}
        onSkip={() => setScreen("browse")}
      />
    );
  }

  if (screen === "server" && chosen) {
    return (
      <ShowServerScreen
        copy={copy}
        menu={menu}
        item={chosen}
        translation={translation}
        onBack={() => setScreen(answers.length > 0 ? "results" : "browse")}
      />
    );
  }

  return (
    <ResultsScreen
      copy={copy}
      results={results ?? { items: [], isApproximate: false, hasAlternates: false }}
      translation={translation}
      languageButton={languageButton}
      onShuffle={() => setPage((current) => current + 1)}
      onStartOver={startQuestions}
      onPick={pickDish}
    />
  );
}
