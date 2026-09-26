import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { homePath } from '../components/layout/navigation'
import { ThreadWall } from '../components/layout/ThreadWall'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Feedback'
import { Field, Input } from '../components/ui/Field'
import { useAuth } from '../contexts/auth-context'
import { errorMessage } from '../services/api'

/** Aceita só caminhos internos no ?next= (evita redirecionar para outro site) */
function safeNext(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

export function LoginPage(): JSX.Element {
  const { me, login } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (me) return <Navigate to={safeNext(params.get('next')) ?? homePath(me)} replace />

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      // o <Navigate> acima assume depois que `me` chega
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-dvh bg-card lg:grid-cols-[1.1fr_1fr]">
      {/* expositor de linhas */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-wall px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white lg:px-14 lg:py-14">
        <div className="relative z-10 [&_.fill-primary]:fill-white/90">
          <Logo className="text-white" />
        </div>
        <ThreadWall rows={3} columns={9} className="relative my-8 max-w-md opacity-95 lg:my-0 lg:max-w-xl lg:self-center" />
        <div className="relative z-10 max-w-md">
          <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em] lg:text-[30px]">
            Veja a peça pronta com outro tecido, antes de cortar.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            Foto do modelo, foto do tecido, e a cliente enxerga o resultado ali mesmo, no balcão.
          </p>
        </div>
      </section>

      {/* formulário */}
      <section className="flex items-center justify-center px-6 py-10 lg:px-14">
        <form onSubmit={(event) => void handleSubmit(event)} className="w-full max-w-sm" noValidate>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use o e-mail e a senha que a responsável da loja cadastrou.</p>

          <div className="mt-8 flex flex-col gap-4">
            {error && <Alert>{error}</Alert>}
            <Field label="E-mail">
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            <Field label="Senha">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </Field>
            <Button type="submit" size="lg" loading={submitting} disabled={!email || !password} className="mt-2 w-full">
              Entrar
            </Button>
          </div>

          <p className="mt-8 text-[13px] text-muted-foreground">
            Esqueceu a senha? Peça para a responsável da loja criar uma nova.
          </p>
        </form>
      </section>
    </div>
  )
}
