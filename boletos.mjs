import { supabase } from './supabaseClient.mjs'

// OBTENER NÚMEROS YA USADOS
async function obtenerNumerosUsados(config_id) {
  const { data, error } = await supabase
    .from('boletos')
    .select('numero')
    .eq('config_id', config_id)

  if (error) throw error

  return (data || []).map(b => b.numero)
}

// GENERAR BOLETOS SIN DUPLICADOS
export async function generarBoletos(cantidad, compra_id, config_id) {
  const usados = await obtenerNumerosUsados(config_id)

  const usadosSet = new Set(usados)

  const disponibles = []

  for (let i = 0; i < 10000; i++) {
    const numero = i.toString().padStart(4, '0')

    if (!usadosSet.has(numero)) {
      disponibles.push(numero)
    }
  }

  if (disponibles.length < cantidad) {
    throw new Error('No hay suficientes boletos disponibles')
  }

  // Mezclar disponibles
  for (let i = disponibles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[disponibles[i], disponibles[j]] =
      [disponibles[j], disponibles[i]]
  }

  const nuevos = disponibles.slice(0, cantidad)

  const boletosInsertar = nuevos.map(numero => ({
    numero,
    compra_id,
    config_id
  }))

  const chunkSize = 500

  for (let i = 0; i < boletosInsertar.length; i += chunkSize) {
    const chunk = boletosInsertar.slice(i, i + chunkSize)

    const { error } = await supabase
      .from('boletos')
      .insert(chunk)

    if (error) throw error
  }

  return nuevos
}

// OBTENER PROGRESO DE LA RIFA
export async function obtenerProgreso() {
  const { data: configActual, error: configError } = await supabase
    .from('configuracion')
    .select('id, total_boletos, precio')
    .eq('estado', 'activa')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (configError || !configActual) {
    return {
      vendidos: 0,
      total: 0,
      porcentaje: 0,
      restantes: 0,
      compradores: 0,
      recaudado: 0
    }
  }

  const { data: boletos, error: boletosError } = await supabase
    .from('boletos')
    .select('id')
    .eq('config_id', configActual.id)

  if (boletosError) throw boletosError

  const vendidos = (boletos || []).length

  const { count: compradores } = await supabase
    .from('compras')
    .select('*', { count: 'exact', head: true })
    .eq('config_id', configActual.id)
    .eq('estado', 'aprobado')

  const recaudado =
    vendidos * Number(configActual.precio || 0)

  const total =
    Number(configActual.total_boletos || 0)

  const restantes =
    Math.max(total - vendidos, 0)

  const porcentaje = total > 0
    ? Number(((vendidos / total) * 100).toFixed(2))
    : 0

  return {
    vendidos,
    total,
    porcentaje,
    restantes,
    compradores: compradores || 0,
    recaudado
  }
}