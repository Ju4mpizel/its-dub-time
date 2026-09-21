import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Configuración de ejecución máxima para Vercel Serverless
export const maxDuration = 60;

const SPEAKER_PALETTES = [
  { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-400" },
  { bg: "bg-sky-500", border: "border-sky-500", text: "text-sky-400" },
  {
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-emerald-400",
  },
  { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-400" },
  { bg: "bg-rose-500", border: "border-rose-500", text: "text-rose-400" },
];

const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
];

function formatTimecode(seconds) {
  const totalMs = Math.floor(seconds * 1000);
  const h = Math.floor(totalMs / 3600000)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalMs % 3600000) / 60000)
    .toString()
    .padStart(2, "0");
  const s = Math.floor((totalMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const frames = Math.floor(((totalMs % 1000) / 1000) * 24)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}:${frames}`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No se subió ningún archivo." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Falta GEMINI_API_KEY en las variables de entorno de Vercel.",
        },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = `
Eres un asistente experto en subtitulado y guionado técnico para doblaje cinematográfico.
Analiza este clip multimedia y extrae cada turno de diálogo individual.
Reglas:
1. No fusiones oraciones de diferentes personajes en un solo turno.
2. Identifica al personaje por su nombre si es reconocible (ej. Woody, Buzz Lightyear) o por su voz/rol.
3. Proporciona tiempos de inicio (start) y fin (end) precisos en segundos con decimales.
4. Transcribe el texto exacto dicho por el personaje sin omitir palabras.
`;

    let responseText = null;
    let lastError = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`Procesando transcripción con: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: file.type || "video/mp4",
                    data: base64Data,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                duration: {
                  type: Type.NUMBER,
                  description: "Duración total aproximada en segundos",
                },
                dialogues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: {
                        type: Type.STRING,
                        description: "Nombre del personaje",
                      },
                      start: {
                        type: Type.NUMBER,
                        description: "Segundo de inicio",
                      },
                      end: { type: Type.NUMBER, description: "Segundo de fin" },
                      text: {
                        type: Type.STRING,
                        description: "Texto del diálogo",
                      },
                    },
                    required: ["speaker", "start", "end", "text"],
                  },
                },
              },
              required: ["dialogues"],
            },
          },
        });

        responseText = response.text;
        if (responseText) break;
      } catch (err) {
        lastError = err;
        console.warn(
          `Aviso: ${modelName} no disponible (${err?.status || err?.message}). Probando alternativa...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (!responseText) {
      throw (
        lastError ||
        new Error("No se pudo obtener respuesta de los modelos disponibles.")
      );
    }

    const parsed = JSON.parse(responseText);

    const speakerMap = new Map();
    const characters = {};
    let speakerCounter = 0;

    const formattedDialogues = (parsed.dialogues || []).map((d, index) => {
      if (!speakerMap.has(d.speaker)) {
        const id = speakerCounter++;
        const palette = SPEAKER_PALETTES[id % SPEAKER_PALETTES.length];
        speakerMap.set(d.speaker, id);
        characters[id] = {
          id,
          name: d.speaker,
          ...palette,
        };
      }

      const speakerId = speakerMap.get(d.speaker);

      return {
        id: index + 1,
        speaker: speakerId,
        start: d.start,
        end: d.end,
        timecode: `${formatTimecode(d.start)} - ${formatTimecode(d.end)}`,
        text: d.text,
      };
    });

    const calculatedDuration =
      parsed.duration ||
      (formattedDialogues.length > 0
        ? Math.max(...formattedDialogues.map((d) => d.end)) + 1
        : 60);

    return NextResponse.json({
      duration: calculatedDuration,
      characters,
      dialogues: formattedDialogues,
    });
  } catch (err) {
    console.error("Error final con Gemini:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar el audio con Gemini." },
      { status: 500 },
    );
  }
}
