"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 1. Conexión con Supabase del arch env local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Definición de la estructura de los datos
interface Gasto {
  id: number;
  fecha: string;
  comercio: string;
  categoria: string;
  total: number;
}

export default function Dashboard() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Al cargar la página, se busca los datos
  useEffect(() => {
    async function obtenerGastos() {
      try {
        const { data, error } = await supabase
          .from("gastos")
          .select("*")
          .order("fecha", { ascending: false }); // Los más nuevos primero

        if (error) throw error;
        setGastos(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    obtenerGastos();
  }, []);

  // 3. Calculamos la suma total de los gastos
  const totalGastado = gastos.reduce((suma, gasto) => suma + Number(gasto.total || 0), 0);

  // 4. Pantalla de carga mientras trae los datos de la nube
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-gray-500 animate-pulse">Consultando la bóveda... 💸</p>
      </div>
    );
  }

  // 5. El diseño visual principal (Frontend)
  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-500">Analista de Gastos y Tickets</p>
        </div>

        {/* Tarjeta de Total */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Gastado</p>
            <p className="text-4xl font-bold text-blue-600 mt-1">
              ${totalGastado.toFixed(2)}
            </p>
          </div>
          <div className="bg-blue-100 p-4 rounded-full">
            <span className="text-2xl">📊</span>
          </div>
        </div>

        {/* Mensaje de error si falla la base de datos */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            Error al cargar los datos: {error}
          </div>
        )}

        {/* Tabla de Gastos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Comercio</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Aún no hay tickets cargados. ¡Es hora de escanear!
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(gasto.fecha).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{gasto.comercio}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{gasto.categoria}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      ${Number(gasto.total).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}