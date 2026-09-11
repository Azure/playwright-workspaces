import { Invoice, LineItem } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash, ArrowLeft } from '@phosphor-icons/react'
import { calculateLineItemAmount, formatCurrency } from '@/lib/helpers'
import { useEffect } from 'react'

interface Step3Props {
  data: Partial<Invoice>
  onChange: (data: Partial<Invoice>) => void
  onNext: () => void
  onBack: () => void
}

export function Step3LineItems({ data, onChange, onNext, onBack }: Step3Props) {
  const lineItems = data.lineItems || []

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `${Date.now()}-${Math.random()}`,
      description: '',
      quantity: 1,
      unit: 'unit',
      unitPrice: 0,
      amount: 0,
    }
    onChange({ ...data, lineItems: [...lineItems, newItem] })
  }

  const removeLineItem = (id: string) => {
    onChange({
      ...data,
      lineItems: lineItems.filter((item) => item.id !== id),
    })
  }

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    const updatedItems = lineItems.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates }
        updated.amount = calculateLineItemAmount(updated.quantity, updated.unitPrice)
        return updated
      }
      return item
    })
    onChange({ ...data, lineItems: updatedItems })
  }

  useEffect(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const taxPercent = data.taxPercent ?? 5
    const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100

    onChange({
      ...data,
      subtotal,
      taxAmount,
      totalAmount,
    })
  }, [lineItems, data.taxPercent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (lineItems.length > 0 && lineItems.every((item) => item.description && item.quantity > 0)) {
      onNext()
    }
  }

  if (lineItems.length === 0) {
    addLineItem()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Line Items</h2>
          <Button type="button" onClick={addLineItem} size="sm" variant="outline">
            <Plus size={16} weight="bold" className="mr-2" />
            Add Line Item
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold min-w-[250px]">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-24">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-32">Unit Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-32">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="px-4 py-3">
                      <Input
                        data-field-id={`lineItem-${item.id}-description`}
                        aria-label="Line item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                        placeholder="Item description..."
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        data-field-id={`lineItem-${item.id}-quantity`}
                        aria-label="Line item quantity"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })
                        }
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        data-field-id={`lineItem-${item.id}-unitPrice`}
                        aria-label="Line item unit price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium">
                        {formatCurrency(item.amount, data.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={16} weight="bold" className="text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3 border rounded-lg p-6 bg-muted/20">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono font-medium">
                {formatCurrency(data.subtotal || 0, data.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <Label htmlFor="taxPercent" className="text-sm text-muted-foreground">
                Tax %
              </Label>
              <Input
                id="taxPercent"
                data-field-id="taxPercent"
                aria-label="Tax percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.taxPercent ?? 5}
                onChange={(e) => onChange({ ...data, taxPercent: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) })}
                className="w-24"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax Amount</span>
              <span className="font-mono font-medium">
                {formatCurrency(data.taxAmount || 0, data.currency)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>Total</span>
              <span className="font-mono">
                {formatCurrency(data.totalAmount || 0, data.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>
        <Button type="submit" size="lg" disabled={lineItems.length === 0}>
          Continue
        </Button>
      </div>
    </form>
  )
}
