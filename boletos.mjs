import { supabase } from './supabaseClient.mjs'

// GENERAR BOLETOS OPTIMIZADOS
export async function generarBoletos(cantidad,compra_id,config_id){

const nuevos=[]
const usados=new Set()

while(nuevos.length<cantidad){

const numero=Math.floor(Math.random()*10000)
.toString()
.padStart(4,'0')

if(usados.has(numero)) continue

const { data:existe,error }=await supabase
.from('boletos')
.select('id')
.eq('numero',numero)
.eq('config_id',config_id)
.limit(1)

if(error) throw error

if(existe.length>0) continue

usados.add(numero)

nuevos.push({
numero,
compra_id,
config_id
})
}

const { error:insertError }=await supabase
.from('boletos')
.insert(nuevos)

if(insertError) throw insertError

return nuevos.map(b=>b.numero)
}

// OBTENER PROGRESO DE LA RIFA
export async function obtenerProgreso(){

const { data:configActual,error:configError }=await supabase
.from('configuracion')
.select('id,total_boletos,precio')
.eq('estado','activa')
.order('created_at',{ascending:false})
.limit(1)
.single()

if(configError||!configActual){
return{
vendidos:0,
total:0,
porcentaje:0,
restantes:0,
compradores:0,
recaudado:0
}
}

const {
count:vendidos,
error:boletosError
}=await supabase
.from('boletos')
.select('*',{count:'exact',head:true})
.eq('config_id',configActual.id)

if(boletosError) throw boletosError

const {
count:compradores
}=await supabase
.from('compras')
.select('*',{count:'exact',head:true})
.eq('config_id',configActual.id)
.eq('estado','aprobado')

const recaudado=
(vendidos||0)*Number(configActual.precio||0)

const total=
Number(configActual.total_boletos||0)

const restantes=
Math.max(total-(vendidos||0),0)

const porcentaje=total>0
? Number((((vendidos||0)/total)*100).toFixed(2))
: 0

return{
vendidos:vendidos||0,
total,
porcentaje,
restantes,
compradores:compradores||0,
recaudado
}
}