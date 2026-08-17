"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 1. Conexión con Supabase del arch env local - claves de acceso a la base de datos-
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
  medio_de_pago: string;
}

// Función principal del dashboard realiza la conexión con la base de datos y muestra los datos en la pantalla
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
          .order("fecha", { ascending: false });

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
      <div className="min-h-screen flex items-center justify-center bg-pink-50 font-serif">
        <p className="text-xl font-semibold text-pink-500 animate-pulse">Consultando la bóveda... 💸</p>
      </div>
    );
  }

  // 5. El diseño visual principal (Frontend modificado a Rosa y Blanco)
  return (
    <main className="min-h-screen bg-pink-50 p-8 font-serif">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold text-pink-900">Panel de Control</h1>
          <p className="text-pink-600">Analista de Gastos y Tickets</p>
        </div>

        {/* Tarjeta de Total */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-pink-400 uppercase tracking-wider">Total Gastado</p>
            <p className="text-4xl font-bold text-pink-600 mt-1">
              ${totalGastado.toFixed(2)}
            </p>
          </div>
          <div className="bg-pink-100 p-4 rounded-full">
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
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          <table className="min-w-full divide-y divide-pink-100">
            <thead className="bg-pink-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-pink-700 uppercase">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-pink-700 uppercase">Comercio</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-pink-700 uppercase">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-pink-700 uppercase">Medio de Pago</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-pink-700 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50 bg-white">
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-pink-400">
                    Aún no hay tickets cargados. ¡Es hora de escanear!
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-pink-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-pink-900">{new Date(gasto.fecha).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-pink-900">{gasto.comercio}</td>
                    <td className="px-6 py-4 text-sm text-pink-500">
                      <span className="bg-pink-50 px-2 py-1 rounded-md text-xs border border-pink-100">{gasto.categoria}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-pink-500">
                      <span className="bg-white text-pink-600 px-2 py-1 rounded-md text-xs border border-pink-200">
                        {gasto.medio_de_pago || 'No especificado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-pink-900 text-right">
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