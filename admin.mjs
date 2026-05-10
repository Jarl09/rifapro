import { supabase } from './supabaseClient.mjs'
import { generarBoletos } from './boletos.mjs'

export async function aprobarCompra(compra_id) {
  const { data: compra, error: errorCompra } = await supabase
    .from('compras')
    .select('id, cantidad, config_id, estado')
    .eq('id', compra_id)
    .single()

  if (errorCompra) throw errorCompra
  if (!compra) throw new Error('Compra no encontrada')
  if (compra.estado !== 'pendiente') throw new Error('Esta compra ya fue procesada')

  // Bloqueo lógico: solo cambia si sigue pendiente
  const { data: locked, error: lockError } = await supabase
    .from('compras')
    .update({ estado: 'procesando' })
    .eq('id', compra_id)
    .eq('estado', 'pendiente')
    .select('id, cantidad, config_id')
    .single()

  if (lockError) throw lockError
  if (!locked) throw new Error('Esta compra ya fue procesada')

  try {
    const boletos = await generarBoletos(locked.cantidad, locked.id, locked.config_id)

    const { error: errorUpdate } = await supabase
      .from('compras')
      .update({ estado: 'aprobado' })
      .eq('id', compra_id)
      .eq('estado', 'procesando')

    if (errorUpdate) throw errorUpdate

    return boletos
  } catch (err) {
    await supabase
      .from('compras')
      .update({ estado: 'pendiente' })
      .eq('id', compra_id)
      .eq('estado', 'procesando')

    throw err
  }
}

export async function rechazarCompra(compra_id) {
  const { data: compra, error: errorCompra } = await supabase
    .from('compras')
    .select('id, estado')
    .eq('id', compra_id)
    .single()

  if (errorCompra) throw errorCompra
  if (!compra) throw new Error('Compra no encontrada')
  if (compra.estado !== 'pendiente') throw new Error('Esta compra ya fue procesada')

  const { data: locked, error: lockError } = await supabase
    .from('compras')
    .update({ estado: 'rechazado' })
    .eq('id', compra_id)
    .eq('estado', 'pendiente')
    .select('id')
    .single()

  if (lockError) throw lockError
  if (!locked) throw new Error('Esta compra ya fue procesada')

  return true
}

export async function obtenerPendientes() {
  const { data: configActual, error: configError } = await supabase
    .from('configuracion')
    .select('id')
    .eq('estado', 'activa')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (configError || !configActual) return []

    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .eq('estado', 'pendiente')
      .eq('config_id', configActual.id)
      .order('created_at', { ascending: true })

  if (error) throw error

  return data
}