import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CaretDown, Check } from '@phosphor-icons/react'

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  id?: string
  'data-field-id'?: string
  'aria-label'?: string
  required?: boolean
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Type to search...',
  id,
  'data-field-id': dataFieldId,
  'aria-label': ariaLabel,
  required,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = search
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options

  // Sync display text when value changes externally
  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const handleSelect = (opt: string) => {
    onValueChange(opt)
    setSearch('')
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (!open) setOpen(true)

    // Auto-select on exact match (case-insensitive)
    const exact = options.find((opt) => opt.toLowerCase() === e.target.value.toLowerCase())
    if (exact) {
      onValueChange(exact)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking within the dropdown
    if (containerRef.current?.contains(e.relatedTarget as Node)) return

    // If typed text matches an option, select it
    if (search) {
      const match = options.find((opt) => opt.toLowerCase() === search.toLowerCase())
      if (match) {
        onValueChange(match)
      }
    }
    setSearch('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearch('')
      setOpen(false)
      inputRef.current?.blur()
    }
    if (e.key === 'Enter' && filtered.length === 1) {
      e.preventDefault()
      handleSelect(filtered[0])
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={open ? search : value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={value || placeholder}
          data-field-id={dataFieldId}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
          required={required && !value}
          className="h-9 text-sm pr-8"
        />
        <CaretDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
      {open && (
        <div
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches found</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={opt === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                  opt === value && 'bg-accent/50 font-medium'
                )}
              >
                <Check
                  size={14}
                  weight="bold"
                  className={cn('shrink-0', opt === value ? 'opacity-100' : 'opacity-0')}
                />
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
