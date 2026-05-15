import { useNavigate } from 'react-router-dom'

export default function Terminos() {
  const navigate = useNavigate()

  return (
    <div className="bg-[#050508] min-h-screen text-white">
      <div className="bg-[#0a0a0f]/80 border-b border-white/5 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">←</button>
        <h1 className="text-lg font-bold">Términos y Privacidad</h1>
      </div>

      <div className="p-6 flex flex-col gap-6 pb-24 max-w-2xl mx-auto">

        <div>
          <div className="text-[#ccff00] text-xs font-black uppercase tracking-widest mb-3">Términos de Uso</div>

          <div className="glass-card p-4 flex flex-col gap-4">
            <div>
              <div className="font-bold mb-1">1. Descripción del servicio</div>
              <p className="text-gray-400 text-sm leading-relaxed">LaminaX es una plataforma P2P que permite a usuarios comprar, vender e intercambiar láminas de álbumes coleccionables. LaminaX actúa como intermediario y no es vendedor ni comprador directo.</p>
            </div>
            <div>
              <div className="font-bold mb-1">2. Responsabilidad del usuario</div>
              <p className="text-gray-400 text-sm leading-relaxed">El usuario es responsable de la veracidad de la información publicada y del estado real de las láminas ofrecidas. Publicar láminas que no posees o en estado diferente al descrito puede resultar en la suspensión de la cuenta.</p>
            </div>
            <div>
              <div className="font-bold mb-1">3. Comisiones</div>
              <p className="text-gray-400 text-sm leading-relaxed">LaminaX cobra una comisión del 7% sobre cada transacción completada. Esta comisión se descuenta del monto recibido por el vendedor. Las transacciones de intercambio no tienen comisión.</p>
            </div>
            <div>
              <div className="font-bold mb-1">4. Sistema de escrow</div>
              <p className="text-gray-400 text-sm leading-relaxed">Los pagos quedan retenidos hasta que el comprador confirme la recepción. Si el comprador no confirma ni reclama en 3 días hábiles tras la entrega, el pago se libera automáticamente al vendedor.</p>
            </div>
            <div>
              <div className="font-bold mb-1">5. Disputas</div>
              <p className="text-gray-400 text-sm leading-relaxed">En caso de disputa, LaminaX mediará y tomará una decisión basada en la evidencia presentada. LaminaX se reserva el derecho de reembolsar al comprador o liberar el pago al vendedor según corresponda.</p>
            </div>
            <div>
              <div className="font-bold mb-1">6. Prohibiciones</div>
              <p className="text-gray-400 text-sm leading-relaxed">Está prohibido: coordinar pagos fuera de la plataforma, publicar láminas falsas o dañadas sin declararlo, crear cuentas múltiples para manipular el mercado, y cualquier conducta fraudulenta.</p>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[#ccff00] text-xs font-black uppercase tracking-widest mb-3">Política de Privacidad</div>

          <div className="glass-card p-4 flex flex-col gap-4">
            <div>
              <div className="font-bold mb-1">Datos que recopilamos</div>
              <p className="text-gray-400 text-sm leading-relaxed">Recopilamos: nombre, correo electrónico, RUT (para verificación de identidad), historial de transacciones y mensajes dentro de la plataforma.</p>
            </div>
            <div>
              <div className="font-bold mb-1">Uso de los datos</div>
              <p className="text-gray-400 text-sm leading-relaxed">Tus datos se usan exclusivamente para operar la plataforma, verificar identidades, procesar transacciones y mejorar el servicio. No vendemos ni compartimos tu información con terceros.</p>
            </div>
            <div>
              <div className="font-bold mb-1">Seguridad</div>
              <p className="text-gray-400 text-sm leading-relaxed">Utilizamos Supabase con cifrado en tránsito y en reposo. Los pagos se procesan a través de pasarelas certificadas. Tu RUT nunca se muestra públicamente.</p>
            </div>
            <div>
              <div className="font-bold mb-1">Tus derechos</div>
              <p className="text-gray-400 text-sm leading-relaxed">Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento contactándonos. Cumplimos con la Ley 19.628 de Protección de Datos Personales de Chile.</p>
            </div>
            <div>
              <div className="font-bold mb-1">Contacto</div>
              <p className="text-gray-400 text-sm leading-relaxed">Para consultas sobre privacidad o términos escríbenos a: contacto@laminax.cl</p>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-600 text-xs">
          Última actualización: Mayo 2026 · LaminaX Chile
        </div>
      </div>
    </div>
  )
}
