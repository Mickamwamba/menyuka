import { NextResponse } from "next/server";
import { toClientError, translateMenu } from "@/lib/anthropic";
import { translatableCopy } from "@/lib/copy";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, targetLanguage, menuLanguage } = body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Nothing to translate." }, { status: 400 });
    }
    if (typeof targetLanguage !== "string" || !targetLanguage) {
      return NextResponse.json({ error: "No language chosen." }, { status: 400 });
    }

    const translation = await translateMenu({
      items,
      ui: translatableCopy(),
      targetLanguage,
      menuLanguage: typeof menuLanguage === "string" ? menuLanguage : "unknown",
    });

    return NextResponse.json(translation);
  } catch (error) {
    const { message, status } = toClientError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
