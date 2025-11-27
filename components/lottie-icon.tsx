"use client"

import { useEffect, useRef, useState } from "react"

interface LottieIconProps {
  animationData?: object
  src?: string
  className?: string
  loop?: boolean
  autoplay?: boolean
}

export function LottieIcon({
  animationData,
  src,
  className = "w-6 h-6",
  loop = true,
  autoplay = true,
}: LottieIconProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let animation: any = null

    const loadLottie = async () => {
      try {
        const lottie = (await import("lottie-web")).default

        if (containerRef.current) {
          const animData = animationData || (src ? await fetch(src).then((r) => r.json()) : null)

          if (animData) {
            animation = lottie.loadAnimation({
              container: containerRef.current,
              renderer: "svg",
              loop,
              autoplay,
              animationData: animData,
            })
            setIsLoaded(true)
          }
        }
      } catch (error) {
        console.error("Lottie loading error:", error)
      }
    }

    loadLottie()

    return () => {
      if (animation) {
        animation.destroy()
      }
    }
  }, [animationData, src, loop, autoplay])

  return <div ref={containerRef} className={className} />
}
