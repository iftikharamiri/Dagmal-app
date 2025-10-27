import { useState } from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function PhoneAuthTest() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isLoading, setIsLoading] = useState(false)

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone) {
      toast.error('Vennligst oppgi et telefonnummer')
      return
    }

    setIsLoading(true)
    
    try {
      // Test: Send OTP
      console.log('📱 Attempting to send OTP to:', phone)
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone
      })

      console.log('📱 OTP Response:', { data, error })

      if (error) {
        console.error('❌ OTP Error Details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        throw error
      }

      toast.success('OTP sendt til din telefon!')
      console.log('✅ OTP sent successfully!')
      setStep('otp')
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      toast.error(error.message || 'Kunne ikke sende OTP')
      console.error('Full error object:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error('Vennligst oppgi en gyldig 6-sifret OTP')
      return
    }

    setIsLoading(true)

    try {
      // Test: Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      })

      if (error) throw error

      toast.success('Innlogging vellykket!')
      console.log('User:', data.user)
      
      // Reset for next test
      setStep('phone')
      setOtp('')
      setPhone('')
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      toast.error(error.message || 'Ugyldig OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Test Phone Authentication</h2>
      
      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Telefonnummer
            </label>
            <PhoneInput
              international
              defaultCountry="NO"
              value={phone}
              onChange={(value) => setPhone(value || '')}
              className="input w-full"
            />
            <p className="text-xs text-muted-fg mt-2">
              Format: +47XXXXXXXX
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Sender OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              OTP (6 siffer)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input w-full text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-muted-fg mt-2">
              OTP sendt til: {phone}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setOtp('')
              }}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Tilbake
            </button>
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Verifiserer...' : 'Verifiser OTP'}
            </button>
          </div>

          <button
            type="button"
            onClick={sendOtp}
            className="text-sm text-muted-fg hover:text-fg w-full"
            disabled={isLoading}
          >
            Send nytt OTP
          </button>
        </form>
      )}

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Hvordan teste:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside text-muted-fg">
          <li>Skriv inn ditt telefonnummer (Norsk: +47)</li>
          <li>Klikk "Send OTP"</li>
          <li>Sjekk SMSen du mottar</li>
          <li>Skriv inn OTP-koden</li>
          <li>Klikk "Verifiser OTP"</li>
        </ol>
      </div>
    </div>
  )
}

