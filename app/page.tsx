"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);
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

            <p className="mt-2 text-sm text-gray-500">
              PNG, JPG o JPEG
            </p>

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

            <p className="mt-2 text-sm text-pink-500">
              {image.name}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}