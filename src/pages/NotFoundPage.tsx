import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { buttonClasses } from '../components/ui/Button'

export function NotFoundPage(): JSX.Element {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <Logo compact className="mb-6 scale-150" />
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Esta página se desfez</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço não existe ou você não tem acesso a ele.
        </p>
        <Link to="/" className={buttonClasses('primary', 'md', 'mt-6')}>
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
