"use client";

import { useState } from "react";

interface DatosTicket {
  comercio: string;
  fecha: string;
  total: number;
  medioPago: string;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [datos, setDatos] = useState<DatosTicket | null>(null);
  const [textoOcr, setTextoOcr] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);
    setDatos(null);
    setError(null);
  };

  const handleAnalizar = async () => {
    if (!image) return;

    setAnalizando(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const respuesta = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "No se pudo analizar el ticket.");
      }

      setDatos({
        comercio: data.comercio,
        fecha: data.fecha,
        total: data.total,
        medioPago: data.medioPago,
      });
      setTextoOcr(data.texto || "");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setAnalizando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-4xl font-bold text-gray-900">
          Analizador de Tickets/Comprobantes
        </h1>

        <p className="mt-3 text-center text-pink-600">
          Subí una imagen de tu ticket o comprobante para extraer su información.
        </p>

        <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
          <label
            htmlFor="ticket"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-12 text-center transition hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="text-5xl">📷</div>

            <p className="mt-4 text-lg font-semibold text-gray-700">
              Seleccioná una imagen
            </p>

            <p className="mt-2 text-sm text-gray-500">PNG, JPG o JPEG</p>

            <input
              id="ticket"
              type="file"
              accept="image/png,image/jpeg" //que solo acepte los archivos que el dispositivo acepte
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {image && (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-pink-900">
              Imagen seleccionada
            </h2>

            <p className="mt-2 text-sm text-pink-500">{image.name}</p>

            <button
              onClick={handleAnalizar}
              disabled={analizando}
              className="mt-6 rounded-full bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analizando ? "Analizando ticket..." : "Analizar ticket"}
            </button>

            {analizando && (
              <p className="mt-3 text-sm text-gray-500">
                Esto puede tardar unos segundos, Tesseract está leyendo la imagen.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-600">
            {error}
          </div>
        )}

        {datos && (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Revisá y corregí los datos detectados
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              El OCR hace lo que puede — corregí lo que haga falta antes de guardar.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Comercio
                </label>
                <input
                  type="text"
                  value={datos.comercio}
                  onChange={(e) =>
                    setDatos({ ...datos, comercio: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <input
                  type="date"
                  value={datos.fecha}
                  onChange={(e) =>
                    setDatos({ ...datos, fecha: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={datos.total}
                  onChange={(e) =>
                    setDatos({
                      ...datos,
                      total: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Medio de pago
                </label>
                <input
                  type="text"
                  value={datos.medioPago}
                  onChange={(e) =>
                    setDatos({ ...datos, medioPago: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 bg-white"
                />
              </div>
            </div>

            <button
              disabled
              title="Todavía falta conectar el guardado a la base de datos"
              className="mt-6 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white opacity-50 cursor-not-allowed"
            >
              Confirmar y guardar (próximo paso)
            </button>

            {textoOcr && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-500">
                  Ver texto detectado (para revisar si algo se leyó mal)
                </summary>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-xs text-gray-800">
                  {textoOcr}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
