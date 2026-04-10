/**
 * Unique Animated Step Indicator Component
 * Features:
 * - Orbital rotating progress
 * - Liquid fill animation for completed steps
 * - Morphing step connector lines
 * - Gradient pulse on active step
 * - Smooth step transitions with easing
 */

"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"

interface Step {
  label: string
  description?: string
}

interface AnimatedStepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  allowClickNavigation?: boolean
}

export function AnimatedStepIndicator({
  steps,
  currentStep,
  onStepClick,
  allowClickNavigation = false,
}: AnimatedStepIndicatorProps) {
  const isCompleted = (stepIndex: number) => stepIndex < currentStep
  const isCurrent = (stepIndex: number) => stepIndex === currentStep

  // Calculate progress percentage
  const progress = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100
  }, [currentStep, steps.length])

  return (
    <div className="w-full py-3 px-2">
      {/* Main Step Container */}
      <div className="flex items-center justify-between gap-1 mb-3">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <motion.div
              className="flex flex-col items-center flex-1"
              onClick={() => allowClickNavigation && onStepClick?.(index)}
            >
              {/* Orbital Background */}
              <div className="relative w-11 h-11 flex items-center justify-center cursor-pointer mb-0.5">
                {/* Outer orbital ring - rotates for active step */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary"
                  animate={isCurrent ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    isCurrent
                      ? {
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }
                      : { duration: 0.3 }
                  }
                />

                {/* Middle glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: isCurrent
                      ? [
                          "0 0 0 0 rgba(245, 160, 34, 0.7)",
                          "0 0 0 15px rgba(246, 171, 59, 0)",
                        ]
                      : "0 0 0 0 rgba(236, 156, 8, 0)",
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: isCurrent ? Number.POSITIVE_INFINITY : 0,
                  }}
                />

                {/* Main Circle */}
                <motion.div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs z-10 ${
                    isCompleted(index)
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  whileHover={allowClickNavigation ? { scale: 1.1 } : {}}
                  whileTap={allowClickNavigation ? { scale: 0.95 } : {}}
                  animate={
                    isCurrent
                      ? {
                          boxShadow: [
                            "0 0 20px rgba(246, 181, 59, 0.5)",
                            "0 0 40px rgba(182, 133, 43, 0.8)",
                            "0 0 20px rgba(231, 156, 16, 0.5)",
                          ],
                        }
                      : {}
                  }
                  transition={
                    isCurrent
                      ? { duration: 2, repeat: Number.POSITIVE_INFINITY }
                      : {}
                  }
                >
                  {/* Completed step - checkmark */}
                  {isCompleted(index) && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  )}

                  {/* Current step - pulsing number */}
                  {isCurrent && (
                    <motion.span
                      key="current"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                      className="font-bold text-base tracking-tight"
                    >
                      {index + 1}
                    </motion.span>
                  )}

                  {/* Upcoming step - number */}
                  {!isCompleted(index) && !isCurrent(index) && (
                    <span key="upcoming" className="font-bold text-base tracking-tight">{index + 1}</span>
                  )}
                </motion.div>

                {/* Liquid fill effect background */}
                {isCompleted(index) && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-b from-green-400/20 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 0, 0.5] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}
              </div>

              {/* Step Label */}
              <motion.div
                className="text-center"
                animate={{
                  opacity: isCurrent ? 1 : 0.7,
                }}
              >
                <p className="text-xs font-semibold text-foreground truncate max-w-20">
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-24">
                    {step.description}
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <motion.div className="relative h-0.5 flex-1 mb-8 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full">
                {/* Progress line with morphing animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  animate={{
                    scaleX:
                      currentStep > index
                        ? 1
                        : currentStep === index
                          ? Math.random() * 0.5 + 0.2
                          : 0,
                    opacity: currentStep > index ? 1 : 0.3,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                  }}
                  style={{ transformOrigin: "left" }}
                />

                {/* Shimmer effect on active connector */}
                {currentStep === index && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>

      {/* Step Counter */}
      <div className="mt-1.5 text-center">
        <motion.p className="text-xs text-muted-foreground font-medium text-opacity-80">
          Step {currentStep + 1} of {steps.length}
        </motion.p>
      </div>
    </div>
  )
}
