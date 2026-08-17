// Interpreta el texto crudo que devuelve el OCR y trata de adivinar
// los datos del ticket. Es un "mejor esfuerzo": el usuario siempre puede
// corregir estos valores antes de confirmar el gasto.

export interface DatosTicket {
  comercio: string;
  fecha: string; // formato YYYY-MM-DD, listo para guardar en Supabase
  total: number;
  medioPago: string;
}

// Regex que reconoce un monto en dos formatos posibles:
// 1) Con separador de miles + decimal al final: "73.625,75" o "1,234.56"
// 2) Sin separador de miles, solo con decimales (o nada): "73625.75", "3899"
const MONTO_REGEX =
  /\$?\s?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/;
const MONTO_REGEX_GLOBAL = new RegExp(MONTO_REGEX, "g");

// Convierte el texto de un monto (con puntos y comas mezclados) a un número.
// Regla: el ÚLTIMO separador seguido de 1 o 2 dígitos hasta el final del
// texto es el separador decimal. Cualquier otro punto o coma antes de eso
// es separador de miles y se descarta. Así entendemos tanto "73.625,75"
// (formato argentino con miles) como "73625.75" (sin separador de miles).
function normalizarMonto(bruto: string): number | null {
  const decimalMatch = bruto.match(/[.,](\d{1,2})$/);
  let parteDecimal = "";
  let parteEntera = bruto;

  if (decimalMatch) {
    parteDecimal = "." + decimalMatch[1];
    parteEntera = bruto.slice(0, bruto.length - decimalMatch[0].length);
  }

  parteEntera = parteEntera.replace(/[.,]/g, "");

  const numero = parseFloat(parteEntera + parteDecimal);
  return isNaN(numero) ? null : numero;
}

// A veces el OCR agrega un espacio de más justo después de la coma o el
// punto decimal (ej: "73625, 75" en vez de "73625,75"), y eso hace que el
// monto se corte antes de leer los decimales. Sacamos esos espacios antes
// de intentar reconocer el número.
function limpiarEspaciosEnMontos(texto: string): string {
  return texto.replace(/(\d)([.,])\s+(\d)/g, "$1$2$3");
}

function extraerMonto(texto: string): number | null {
  const limpio = limpiarEspaciosEnMontos(texto);
  const match = limpio.match(MONTO_REGEX);
  if (!match) return null;
  return normalizarMonto(match[1]);
}

// Palabras clave típicas que suelen aparecer en los tickets argentinos.
// Se revisan en orden: la primera que aparezca en el texto gana.
const MEDIOS_PAGO_CONOCIDOS: { patron: RegExp; etiqueta: string }[] = [
  { patron: /mercado\s*pago/i, etiqueta: "Mercado Pago" },
  { patron: /transferencia/i, etiqueta: "Transferencia" },
  { patron: /d[ée]bito/i, etiqueta: "Tarjeta de débito" },
  { patron: /cr[ée]dito/i, etiqueta: "Tarjeta de crédito" },
  { patron: /visa|mastercard|amex|american express/i, etiqueta: "Tarjeta" },
  { patron: /efectivo/i, etiqueta: "Efectivo" },
  { patron: /\bqr\b/i, etiqueta: "QR" },
];

function detectarMedioPago(textoCrudo: string): string {
  for (const { patron, etiqueta } of MEDIOS_PAGO_CONOCIDOS) {
    if (patron.test(textoCrudo)) return etiqueta;
  }
  return "No detectado";
}

// Muchos comercios (sobre todo cooperativas y cadenas) imprimen su nombre
// más de una vez cerca del encabezado: pegado al logo (que el OCR suele leer
// mal por la tipografía especial) y de nuevo en texto plano más abajo. Si
// encontramos una línea que se repite (o está contenida en otra) entre las
// primeras líneas, es una señal fuerte de que ese texto es el nombre real
// del comercio, aunque la primera aparición haya salido ilegible.
function detectarComercio(lineas: string[]): string {
  const primeras = lineas.slice(0, 8);
  const normalizadas = primeras.map((linea) =>
    linea
      .toUpperCase()
      .replace(/[^A-ZÁÉÍÓÚÑ ]/g, "")
      .trim()
  );

  for (let i = 0; i < normalizadas.length; i++) {
    if (normalizadas[i].length < 4) continue;
    for (let j = i + 1; j < normalizadas.length; j++) {
      if (normalizadas[j].length < 4) continue;
      if (
        normalizadas[i] === normalizadas[j] ||
        normalizadas[i].includes(normalizadas[j]) ||
        normalizadas[j].includes(normalizadas[i])
      ) {
        return primeras[j];
      }
    }
  }

  // Si ninguna línea se repite, usamos la heurística anterior: la primera
  // línea que tenga letras (no un número o símbolo suelto).
  return (
    lineas.find((linea) => /[a-zA-ZÁÉÍÓÚáéíóúñÑ]{3,}/.test(linea)) ||
    "Comercio no detectado"
  );
}

function extraerFecha(
  texto: string
): { dia: string; mes: string; anio: string } | null {
  const fechaRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const match = texto.match(fechaRegex);
  if (!match) return null;

  const [, dia, mes, anioCrudo] = match;
  const anio = anioCrudo.length === 2 ? `20${anioCrudo}` : anioCrudo;
  return { dia, mes, anio };
}

export function interpretarTicket(textoCrudo: string): DatosTicket {
  const lineas = textoCrudo
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);

  const comercio = detectarComercio(lineas);

  // Fecha: muchos tickets tienen DOS fechas — la "fecha de inicio de
  // actividades" del comercio (fija, no cambia nunca) y la fecha real de
  // la compra, que suele estar en una línea que dice "Fecha:". Priorizamos
  // esa línea y evitamos explícitamente la de "inicio de actividades".
  const lineaFecha = lineas.find(
    (linea) =>
      /fecha/i.test(linea) &&
      !/inicio/i.test(linea) &&
      !/actividad/i.test(linea)
  );

  const fechaEncontrada =
    (lineaFecha && extraerFecha(lineaFecha)) || extraerFecha(textoCrudo);

  let fecha = new Date().toISOString().split("T")[0]; // si no se encuentra, usa hoy

  if (fechaEncontrada) {
    fecha = `${fechaEncontrada.anio}-${fechaEncontrada.mes.padStart(
      2,
      "0"
    )}-${fechaEncontrada.dia.padStart(2, "0")}`;
  }

  // Total: primero buscamos una línea que diga "TOTAL" (pero no "SUBTOTAL"),
  // porque ahí suele estar el monto final a pagar, incluso si el ticket
  // tiene descuentos aplicados antes de esa línea. Si no encontramos
  // ninguna línea así, caemos al heurístico anterior: el número más
  // grande de todo el ticket.
  let total = 0;

  const lineaTotal = lineas.find(
    (linea) => /total/i.test(linea) && !/sub\s*total/i.test(linea)
  );

  if (lineaTotal) {
    const monto = extraerMonto(lineaTotal);
    if (monto !== null) total = monto;
  }

  if (total === 0) {
    const textoParaMontos = limpiarEspaciosEnMontos(textoCrudo);
    MONTO_REGEX_GLOBAL.lastIndex = 0;
    const montos: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = MONTO_REGEX_GLOBAL.exec(textoParaMontos)) !== null) {
      const numero = normalizarMonto(match[1]);
      if (numero !== null && numero > 0) montos.push(numero);
    }

    total = montos.length > 0 ? Math.max(...montos) : 0;
  }

  // Medio de pago: busca palabras clave conocidas en todo el texto.
  const medioPago = detectarMedioPago(textoCrudo);

  return { comercio, fecha, total, medioPago };
}
