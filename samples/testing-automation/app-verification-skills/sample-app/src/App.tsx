import { useState, useEffect, useCallback } from 'react'
import { Invoice } from '@/lib/types'
import { generateInvoiceId } from '@/lib/helpers'
import { fetchInvoices, createInvoice, updateInvoice } from '@/lib/invoice-api'
import { InvoiceQueue } from '@/components/InvoiceQueue'
import { StepIndicator } from '@/components/StepIndicator'
import { Step1VendorHeader } from '@/components/forms/Step1VendorHeader'
import { Step3LineItems } from '@/components/forms/Step3LineItems'
import { Step4PaymentCompliance } from '@/components/forms/Step4PaymentCompliance'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, List, User } from '@phosphor-icons/react'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

type View = 'queue' | 'form'

const STEP_LABELS = ['Details', 'Line Items', 'Payment & Review']

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('queue')
  const [currentStep, setCurrentStep] = useState(1)
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    lineItems: [],
    taxPercent: 0,
    requiresApproval: true,
  })

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchInvoices()
      setInvoices(data)
    } catch (err) {
      toast.error('Failed to load invoices', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const handleAddNew = () => {
    setCurrentInvoice({
      lineItems: [],
      taxPercent: 0,
      requiresApproval: true,
    })
    setCurrentStep(1)
    setView('form')
  }

  const handleSelectInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice)
    setCurrentStep(1)
    setView('form')
  }

  const handleBackToQueue = () => {
    setView('queue')
    setCurrentStep(1)
    setCurrentInvoice({
      lineItems: [],
      taxPercent: 0,
      requiresApproval: true,
    })
  }

  const handleUpdateInvoice = (data: Partial<Invoice>) => {
    setCurrentInvoice(data)
  }

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    const now = new Date().toISOString()
    const newInvoice: Invoice = {
      ...(currentInvoice as Invoice),
      id: currentInvoice.id || generateInvoiceId(),
      status: 'submitted',
      assignedTo: 'System',
      lastUpdated: now,
      createdAt: currentInvoice.createdAt || now,
    }

    try {
      const isEdit = invoices.some((inv) => inv.id === newInvoice.id)
      if (isEdit) {
        await updateInvoice(newInvoice)
      } else {
        await createInvoice(newInvoice)
      }

      toast.success('Invoice submitted successfully!', {
        description: `Invoice ${newInvoice.id} has been submitted for processing.`,
      })

      await loadInvoices()
    } catch (err) {
      toast.error('Failed to submit invoice', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    }

    handleBackToQueue()
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      <header className="bg-concur-blue border-b border-concur-dark-blue shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded px-3 py-1">
              <span className="text-concur-blue font-bold text-lg font-lato">Concur</span>
            </div>
            <span className="text-white text-sm font-semibold">Invoice Management</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => view !== 'queue' && handleBackToQueue()}>
              <List size={18} weight="bold" className="mr-2" />
              Queue
            </Button>
            <div className="flex items-center gap-2 text-white">
              <User size={18} weight="fill" />
              <span className="text-sm">Admin User</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto py-6">
        <AnimatePresence mode="wait">
          {view === 'queue' ? (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InvoiceQueue
                invoices={invoices || []}
                loading={loading}
                onAddNew={handleAddNew}
                onSelectInvoice={handleSelectInvoice}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 px-6"
            >
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleBackToQueue} className="text-concur-blue hover:bg-concur-light-blue">
                  <ArrowLeft size={16} weight="bold" className="mr-2" />
                  Back to Queue
                </Button>
              </div>

              <div className="bg-white border rounded shadow-sm p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-concur-dark-blue">
                    {currentInvoice.id ? 'Edit Invoice' : 'Create New Invoice'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {currentInvoice.id ? `Invoice ID: ${currentInvoice.id}` : 'Complete all required fields to submit invoice'}
                  </p>
                </div>

                <StepIndicator currentStep={currentStep} totalSteps={3} labels={STEP_LABELS} />
              </div>

              <Card className="p-6 shadow-sm">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Step1VendorHeader
                        data={currentInvoice}
                        onChange={handleUpdateInvoice}
                        onNext={handleNext}
                      />
                    </motion.div>
                  )}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Step3LineItems
                        data={currentInvoice}
                        onChange={handleUpdateInvoice}
                        onNext={handleNext}
                        onBack={handleBack}
                      />
                    </motion.div>
                  )}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Step4PaymentCompliance
                        data={currentInvoice}
                        onChange={handleUpdateInvoice}
                        onSubmit={handleSubmit}
                        onBack={handleBack}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
