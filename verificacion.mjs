import { supabase } from './supabaseClient.mjs'

function ocultarTelefono(tel = '') {
  const limpio = tel.replace(/\D/g, '')
  if (limpio.length < 6) return limpio
  return `${limpio.slice(0, 3)}****${limpio.slice(-2)}`
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export async function buscarBoletos(valor) {
  const entrada = String(valor || '').replace(/\D/g, '')

  const { data: configActual, error: configError } = await supabase
    .from('configuracion')
    .select('id, titulo')
    .eq('estado', 'activa')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (configError || !configActual) {
    return {
      estado: 'error',
      mensaje: 'No hay una rifa activa disponible'
    }
  }

  // ─────────────────────────────────────────────
  // BUSCAR POR BOLETO
  // ─────────────────────────────────────────────

  if (entrada.length === 4) {

    const { data: boleto } = await supabase
      .from('boletos')
      .select('numero, compra_id')
      .eq('numero', entrada)
      .eq('config_id', configActual.id)
      .limit(1)
      .single()

    if (boleto) {

      const { data: compra } = await supabase
        .from('compras')
        .select('id, nombre, telefono, estado, created_at')
        .eq('id', boleto.compra_id)
        .eq('config_id', configActual.id)
        .limit(1)
        .single()

      if (!compra) {
        return {
          estado: 'no_encontrado',
          mensaje: 'Número no encontrado'
        }
      }

      const { data: boletos } = await supabase
        .from('boletos')
        .select('numero')
        .eq('compra_id', compra.id)
        .eq('config_id', configActual.id)

      return {
        estado: compra.estado,
        nombre: compra.nombre,
        telefono: ocultarTelefono(compra.telefono),
        fecha: formatearFecha(compra.created_at),
        boletoConsultado: entrada,
        boletos: (boletos || []).map(b => b.numero),
        rifa: configActual.titulo
      }
    }
  }

  // ─────────────────────────────────────────────
  // BUSCAR POR TELÉFONO
  // ─────────────────────────────────────────────

  const { data: compra } = await supabase
    .from('compras')
    .select('id, nombre, telefono, estado, created_at')
    .eq('config_id', configActual.id)
    .eq('telefono', entrada)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!compra) {
    return {
      estado: 'no_encontrado',
      mensaje: 'No se encontraron boletos para este número'
    }
  }

  // SI ESTÁ PENDIENTE O RECHAZADO
  if (compra.estado !== 'aprobado') {
    return {
      estado: compra.estado,
      nombre: compra.nombre,
      telefono: ocultarTelefono(compra.telefono),
      fecha: formatearFecha(compra.created_at),
      boletos: [],
      rifa: configActual.titulo
    }
  }

  const { data: boletos } = await supabase
    .from('boletos')
    .select('numero')
    .eq('compra_id', compra.id)
    .eq('config_id', configActual.id)

  return {
    estado: 'aprobado',
    nombre: compra.nombre,
    telefono: ocultarTelefono(compra.telefono),
    fecha: formatearFecha(compra.created_at),
    boletos: (boletos || []).map(b => b.numero),
    rifa: configActual.titulo
  }
}