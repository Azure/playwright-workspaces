import { useState, useRef, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { CalendarBlank } from '@phosphor-icons/react'
import { format, parse, isValid } from 'date-fns'
import { cn } from '@/lib/utils'

const PARSE_FORMATS = [
  'MM/dd/yyyy',
  'M/d/yyyy',
  'MM-dd-yyyy',
  'M-d-yyyy',
  'yyyy-MM-dd',
  'MMM d, yyyy',
  'MMMM d, yyyy',
  'dd MMM yyyy',
  'dd MMMM yyyy',
]

function tryParseDate(input: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  for (const fmt of PARSE_FORMATS) {
    try {
      const parsed = parse(trimmed, fmt, new Date())
      if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
        return parsed
      }
    } catch {
      // continue
    }
  }

  // Fallback: try native Date constructor for other formats
  const native = new Date(trimmed)
  if (isValid(native) && native.getFullYear() > 1900 && native.getFullYear() < 2100) {
    return native
  }

  return null
}

interface DatePickerInputProps {
  value?: string
  onChange: (isoString: string) => void
  placeholder?: string
  className?: string
  'data-field-id'?: string
  'aria-label'?: string
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'MM/DD/YYYY or pick a date',
  className,
  'data-field-id': dataFieldId,
  'aria-label': ariaLabel,
}: DatePickerInputProps) {
  const [textValue, setTextValue] = useState('')
  const [open, setOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync text field when value prop changes (e.g. from calendar pick)
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (isValid(date)) {
        setTextValue(format(date, 'MM/dd/yyyy'))
        setHasError(false)
      }
    } else {
      setTextValue('')
      setHasError(false)
    }
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setTextValue(raw)
    setHasError(false)
  }

  const handleTextBlur = () => {
    if (!textValue.trim()) {
      onChange('')
      setHasError(false)
      return
    }

    const parsed = tryParseDate(textValue)
    if (parsed) {
      onChange(parsed.toISOString())
      setTextValue(format(parsed, 'MM/dd/yyyy'))
      setHasError(false)
    } else {
      setHasError(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTextBlur()
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date.toISOString())
      setOpen(false)
    }
  }

  const selectedDate = value ? new Date(value) : undefined

  return (
    <div className={cn('flex gap-1', className)}>
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          data-field-id={dataFieldId}
          aria-label={ariaLabel}
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'h-9 text-sm',
            hasError && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {hasError && (
          <p className="text-[10px] text-destructive mt-0.5">
            Invalid date. Try MM/DD/YYYY
          </p>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 shrink-0',
              'hover:bg-accent hover:text-accent-foreground transition-colors'
            )}
            aria-label="Open calendar"
          >
            <CalendarBlank size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
