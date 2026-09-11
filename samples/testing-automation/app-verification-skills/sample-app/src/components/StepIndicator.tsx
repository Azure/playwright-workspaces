import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="w-full bg-white border rounded shadow-sm p-4">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 border-2',
                  step < currentStep
                    ? 'bg-[oklch(0.60_0.12_150)] border-[oklch(0.60_0.12_150)] text-white'
                    : step === currentStep
                      ? 'bg-concur-blue border-concur-blue text-white'
                      : 'bg-white border-border text-muted-foreground'
                )}
              >
                {step < currentStep ? <Check size={16} weight="bold" /> : step}
              </div>
              <span
                className={cn(
                  'text-xs mt-1.5 text-center',
                  step === currentStep ? 'text-concur-blue font-semibold' : 'text-muted-foreground'
                )}
              >
                {labels[index]}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 transition-all duration-200 mt-[-20px]',
                  step < currentStep ? 'bg-[oklch(0.60_0.12_150)]' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
