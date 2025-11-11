import React, { forwardRef, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Loader2, SendHorizontal, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";

const DRAG_CONSTRAINTS = { left: 0, right: 155 }
const DRAG_THRESHOLD = 0.9

const BUTTON_STATES = {
  initial: { width: "12rem" },
  completed: { width: "8rem" },
}

const ANIMATION_CONFIG = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
}

const StatusIcon = ({ status }) => {
  const iconMap = useMemo(() => ({
    loading: <Loader2 className="animate-spin" size={20} />,
    success: <Check size={20} />,
    error: <X size={20} />,
  }), [])

  if (!iconMap[status]) return null

  return (
    <motion.div
      key={crypto.randomUUID()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}>
      {iconMap[status]}
    </motion.div>
  );
}

const useButtonStatus = (resolveTo, onComplete) => {
  const [status, setStatus] = useState("idle")

  const handleSubmit = useCallback(async () => {
    setStatus("loading")
    try {
      if (onComplete) {
        await onComplete()
        setStatus("success")
      } else {
        setTimeout(() => {
          setStatus(resolveTo)
        }, 2000)
      }
    } catch (error) {
      setStatus("error")
      // Auto-reset after error (faster reset)
      setTimeout(() => {
        setStatus("idle")
      }, 1500) // Reduced from 2000 to 1500ms
    }
  }, [resolveTo, onComplete])

  const resetStatus = useCallback(() => {
    setStatus("idle")
  }, [])

  return { status, handleSubmit, resetStatus }
}

const SlideButton = forwardRef(({ className, onComplete, ...props }, ref) => {
  const [isDragging, setIsDragging] = useState(false)
  const [completed, setCompleted] = useState(false)
  const dragHandleRef = useRef(null)
  const { status, handleSubmit, resetStatus } = useButtonStatus("success", onComplete)

  const dragX = useMotionValue(0)
  const springX = useSpring(dragX, ANIMATION_CONFIG.spring)
  const dragProgress = useTransform(springX, [0, DRAG_CONSTRAINTS.right], [0, 1])

  // Reset component when status changes back to idle
  useEffect(() => {
    if (status === "idle" && completed) {
      setCompleted(false)
      dragX.set(0)
    }
  }, [status, completed, dragX])

  const handleDragStart = useCallback(() => {
    if (completed) return
    setIsDragging(true)
  }, [completed])

  const handleDragEnd = () => {
    if (completed) return
    setIsDragging(false)

    const progress = dragProgress.get()
    if (progress >= DRAG_THRESHOLD) {
      setCompleted(true)
      handleSubmit()
    } else {
      dragX.set(0)
    }
  }

  const handleDrag = (
    _event,
    info
  ) => {
    if (completed) return
    const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right))
    dragX.set(newX)
  }

  const adjustedWidth = useTransform(springX, (x) => x + 10)

  return (
    <motion.div
      animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
      transition={ANIMATION_CONFIG.spring}
      className="shadow-button-inset dark:shadow-button-inset-dark relative flex h-9 items-center justify-center rounded-full bg-gray-100">
      {!completed && (
        <motion.div
          style={{
            width: adjustedWidth,
          }}
          className="absolute inset-y-0 left-0 z-0 rounded-full bg-accent" />
      )}
      <AnimatePresence key={crypto.randomUUID()}>
        {!completed && (
          <motion.div
            ref={dragHandleRef}
            drag="x"
            dragConstraints={DRAG_CONSTRAINTS}
            dragElastic={0.05}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
            style={{ x: springX }}
            className="absolute -left-4 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing">
            <Button
              ref={ref}
              disabled={status === "loading"}
              {...props}
              size="icon"
              className={cn(
                "shadow-button rounded-full drop-shadow-xl",
                isDragging && "scale-105 transition-transform",
                className
              )}>
              <SendHorizontal className="size-4 text-black dark:text-black" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence key={crypto.randomUUID()}>
        {completed && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <Button
              ref={ref}
              disabled={status === "loading"}
              onClick={status === "error" ? resetStatus : undefined}
              {...props}
              className={cn(
                "size-full rounded-full transition-all duration-300", 
                status === "error" && "cursor-pointer hover:bg-red-600",
                className
              )}>
              <AnimatePresence key={crypto.randomUUID()} mode="wait">
                <StatusIcon status={status} />
              </AnimatePresence>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
})

SlideButton.displayName = "SlideButton"

export default SlideButton
