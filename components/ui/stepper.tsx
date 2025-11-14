import * as React from "react"
import { cn } from "@/src/main/webapp/app/lib/utils"
import { Check } from "lucide-react"

interface Step {
  title: string
  description?: string
}

interface StepperContextValue {
  activeStep: number
  setActiveStep: (step: number) => void
  totalSteps: number
  isComplete: (step: number) => boolean
}

const StepperContext = React.createContext<StepperContextValue | undefined>(undefined)

const useStepper = () => {
  const context = React.useContext(StepperContext)
  if (!context) {
    throw new Error("useStepper must be used within a Stepper")
  }
  return context
}

interface StepperProps {
  activeStep: number
  children: React.ReactNode
  className?: string
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ activeStep, children, className }, ref) => {
    const [currentStep, setCurrentStep] = React.useState(activeStep)
    const steps = React.Children.toArray(children)
    const totalSteps = steps.length

    const isComplete = (step: number) => currentStep > step

    React.useEffect(() => {
      setCurrentStep(activeStep)
    }, [activeStep])

    return (
      <StepperContext.Provider
        value={{
          activeStep: currentStep,
          setActiveStep: setCurrentStep,
          totalSteps,
          isComplete,
        }}
      >
        <div ref={ref} className={cn("space-y-4", className)}>
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

interface StepProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  index: number
}

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ title, description, children, className, index }, ref) => {
    const { activeStep, isComplete } = useStepper()
    const isActive = activeStep === index
    const isCompleted = isComplete(index)
    const isPending = activeStep < index

    // Render minimal placeholder for pending steps
    if (isPending) {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-3 opacity-40", className)}
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-gray-600 text-xs font-bold"
          >
            {index + 1}
          </div>
          <span className="text-sm text-gray-500">{title}</span>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          className
        )}
      >
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border transition-all",
            isActive && "bg-blue-50 border-blue-200",
            isCompleted && "bg-green-50 border-green-200"
          )}
        >
          <div className="flex-shrink-0">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                isActive && "bg-blue-500 text-white",
                isCompleted && "bg-green-500 text-white"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h3
                className={cn(
                  "text-sm font-medium",
                  isActive && "text-blue-900",
                  isCompleted && "text-green-900"
                )}
              >
                {title}
              </h3>
              {description && (
                <p
                  className={cn(
                    "text-xs mt-1",
                    isActive && "text-blue-700",
                    isCompleted && "text-green-700"
                  )}
                >
                  {description}
                </p>
              )}
            </div>

            {isActive && children && (
              <div className="mt-3">{children}</div>
            )}
          </div>
        </div>
      </div>
    )
  }
)
Step.displayName = "Step"

export { Stepper, Step, useStepper }
