import { NextRequest, NextResponse } from "next/server";

// TTS API endpoint that mirrors the FreeTTS.ru approach.
// FreeTTS.ru uses Yandex SpeechKit under the hood, which provides the
// "Dmitry" (Дмитрий) voice — a male Russian neural voice.
//
// This endpoint generates audio for the given text using the best available
// Russian male TTS engine. It tries in order:
//   1. Yandex SpeechKit Cloud API (if YANDEX_API_KEY env is set) — "ermilov"
//      voice which is the closest match to the FreeTTS "Дмитрий" voice.
//   2. A fallback that returns a 503 (the client then uses the browser's
//      built-in Web Speech API, preferring any system voice named "Дмитрий"
//      or another male Russian voice).
//
// The audio is returned as audio/mpeg (MP3) so the client can play it via
// a standard <audio> element.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// In-memory LRU cache for generated audio (text -> base64 mp3)
// Keeps up to 64 entries to avoid unbounded memory growth.
const audioCache = new Map<string, { audio: Buffer; contentType: string }>();
const CACHE_LIMIT = 64;

function cacheGet(key: string) {
  const entry = audioCache.get(key);
  if (!entry) return null;
  // Move to end (most recently used)
  audioCache.delete(key);
  audioCache.set(key, entry);
  return entry;
}

function cacheSet(key: string, value: { audio: Buffer; contentType: string }) {
  if (audioCache.size >= CACHE_LIMIT) {
    // Evict oldest entry
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(key, value);
}

async function synthesizeWithYandex(text: string): Promise<{
  audio: Buffer;
  contentType: string;
} | null> {
  const apiKey = process.env.YANDEX_API_KEY || process.env.YC_API_KEY;
  const folderId = process.env.YC_FOLDER_ID;
  if (!apiKey || !folderId) return null;

  // Yandex SpeechKit: the "ermilov" voice is the closest male Russian neural
  // voice available. FreeTTS.ru labels it as "Дмитрий" in their UI.
  // https://cloud.yandex.ru/docs/speechkit/tts/voices
  const voice = "ermilov";

  try {
    const body = new URLSearchParams({
      text,
      lang: "ru-RU",
      voice,
      format: "mp3",
      sampleRateHertz: "48000",
      folderId,
    }).toString();

    const res = await fetch(
      "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
      {
        method: "POST",
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!res.ok) return null;
    const audio = Buffer.from(await res.arrayBuffer());
    return { audio, contentType: "audio/mpeg" };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || typeof text !== "string" || text.length === 0) {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 },
      );
    }
    // Cap text length to avoid abuse (Yandex limit is ~5000 chars)
    const trimmed = text.slice(0, 4500);

    const cacheKey = trimmed;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return new NextResponse(cached.audio, {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "private, max-age=86400",
        },
      });
    }

    const result = await synthesizeWithYandex(trimmed);
    if (!result) {
      // No Yandex API key configured — tell client to fall back to Web Speech API
      return NextResponse.json(
        {
          error: "TTS engine not configured",
          fallback: "web-speech-api",
          hint: "Set YANDEX_API_KEY and YC_FOLDER_ID env vars to enable server-side synthesis with the Dmitry (ermilov) voice.",
        },
        { status: 503 },
      );
    }

    cacheSet(cacheKey, result);
    return new NextResponse(result.audio, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal error", message: String(err) },
      { status: 500 },
    );
  }
}
