import { supabase } from './supabaseClient.mjs'

export async function subirComprobante(file) {

  const fileName = `${Date.now()}_${file.originalname}`

  const { data, error } = await supabase.storage
    .from('comprobantes')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    })

  if (error) {
    console.error('ERROR SUBIENDO:', error)
    throw error
  }

  console.log('SUBIDA OK:', fileName)

  const { data: urlData } = supabase.storage
    .from('comprobantes')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}