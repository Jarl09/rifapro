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

  if (configError || !configActual) return null

  // ── BUSCAR POR NÚMERO DE BOLETO ─────────────────────
  if (entrada.length === 4) {
    const { data: boleto, error: boletoError } = await supabase
      .from('boletos')
      .select('numero, compra_id')
      .eq('numero', entrada)
      .eq('config_id', configActual.id)
      .limit(1)
      .single()

    if (!boletoError && boleto) {
      const { data: compra, error: compraError } = await supabase
        .from('compras')
        .select('id, nombre, telefono, estado, created_at')
        .eq('id', boleto.compra_id)
        .eq('config_id', configActual.id)
        .eq('estado', 'aprobado')
        .limit(1)
        .single()

      if (compraError || !compra) return null

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
        boletoConsultado: entrada,
        boletos: (boletos || []).map(b => b.numero),
        rifa: configActual.titulo
      }
    }
  }

  // ── BUSCAR POR TELÉFONO ─────────────────────────────
  const { data: compra, error: compraError } = await supabase
    .from('compras')
    .select('id, nombre, telefono, created_at')
    .eq('config_id', configActual.id)
    .eq('telefono', entrada)
    .eq('estado', 'aprobado')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (compraError || !compra) return null

  const { data: boletos, error: errorBoletos } = await supabase
    .from('boletos')
    .select('numero')
    .eq('compra_id', compra.id)
    .eq('config_id', configActual.id)

  if (errorBoletos) return null

  return {
    estado: 'aprobado',
    nombre: compra.nombre,
    telefono: ocultarTelefono(compra.telefono),
    fecha: formatearFecha(compra.created_at),
    boletoConsultado: null,
    boletos: (boletos || []).map(b => b.numero),
    rifa: configActual.titulo
  }
}