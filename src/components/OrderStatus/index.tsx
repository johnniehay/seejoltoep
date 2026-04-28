import { OrderStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = {
  status: StatusOptions
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'text-xs tracking-widest font-mono uppercase py-0 px-2 rounded w-fit',
        className,
        {
          'bg-orange-500': status === 'pending',
          'bg-green-100': status === 'processing',
          'bg-green-500': status === 'completed',
        },
      )}
    >
      {status === 'pending' && 'Betaling Uitstaande'}
      {status === 'processing' && 'Bestelling & Betaling Ontvang'}
      {status === 'completed' && 'voltooi'}
    </div>
  )
}
