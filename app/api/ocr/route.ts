import { NextRequest, NextResponse } from "next/server";
import { createWorker, PSM } from "tesseract.js";
import sharp from "sharp";
import { interpretarTicket } from "@/lib/parseTicket";

// Esta ruta recibe una imagen de ticket, la procesa con Tesseract.js
// y devuelve los datos ya interpretados (comercio, fecha, total, medioPago),
// además del texto crudo por si sirve para debug.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ninguna imagen." },
        { status: 400 }
      );
    }

    const bufferOriginal = Buffer.from(await file.arrayBuffer());

    // Las fotos de tickets suelen tener fondo (mesa, mano, etc.) alrededor
    // del papel, y eso puede confundir a Tesseract y hacer que "lea" texto
    // donde no hay. Procesamos la imagen antes de pasarla al OCR:
    // - escala de grises: elimina distracciones de color.
    // - normalize: estira el contraste (como un "autocontraste").
    // - threshold: convierte todo a blanco o negro puro, remarcando mucho
    //   más las letras del ticket frente al fondo.
    // - resize: estandariza el ancho, agrandando fotos chicas para que el
    //   texto tenga más definición.
    const bufferProcesado = await sharp(bufferOriginal)
      .resize({ width: 1600, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .threshold(150)
      .toBuffer();

    // "spa" = diccionario de español, para leer mejor los tickets argentinos.
    const worker = await createWorker("spa");

    // Le decimos a Tesseract que asuma una sola columna de texto (así están
    // organizados los tickets), en vez de intentar adivinar la distribución
    // de la página, que es lo que lo confunde con el fondo de la foto.
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
    });

    let texto = "";
    try {
      const resultado = await worker.recognize(bufferProcesado);
      texto = resultado.data.text;
    } finally {
      await worker.terminate();
    }

    const datos = interpretarTicket(texto);

    return NextResponse.json({ texto, ...datos });
  } catch (error) {
    console.error("Error procesando OCR:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la imagen. Probá con otra foto." },
      { status: 500 }
    );
  }
}
