import { supabase } from './supabaseClient.mjs'

export async function crearCompra({
  nombre,
  telefono,
  cantidad,
  monto,
  comprobante_url,
  metodo_pago,
  estado,
  config_id
}) {
  const { data, error } = await supabase
    .from('compras')
    .insert([{
      nombre,
      telefono,
      cantidad,
      monto,
      comprobante_url,
      metodo_pago,
      estado,
      config_id
    }])
    .select()
    .single()

if (error) throw error
return data
}