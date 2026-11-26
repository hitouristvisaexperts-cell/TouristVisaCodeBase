import type React from "react"
import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageCard {
  id: string
  src: string
  alt: string
  rotation: number
}

interface ImageCarouselHeroProps {
  title: string
  subtitle: string
  description: string
  ctaText: string
  onCtaClick?: () => void
  images: ImageCard[]
  features?: Array<{
    title: string
    description: string
  }>
}

export function ImageCarouselHero({
  title,
  description,
  ctaText,
  onCtaClick,
  images,
  features = [
    { title: "Realistic Results", description: "Photos that look professionally crafted" },
    { title: "Fast Generation",   description: "Turn ideas into images in seconds."       },
    { title: "Diverse Styles",    description: "Choose from a wide range of artistic options." },
  ],
}: ImageCarouselHeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [rotatingCards, setRotatingCards] = useState<number[]>([])

  useEffect(() => {
    setRotatingCards(images.map((_, i) => i * (360 / images.length)))
  }, [images.length])

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingCards(prev => prev.map(angle => (angle + 0.4) % 360))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top)  / rect.height,
    })
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-background via-background to-background overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">

        {/* Orbiting image cards */}
        <div
          className="relative w-full max-w-6xl h-96 sm:h-[500px] mb-12 sm:mb-16"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePosition({ x: 0.5, y: 0.5 })}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: "1200px" }}
          >
            {images.map((image, index) => {
              const angle  = (rotatingCards[index] ?? 0) * (Math.PI / 180)
              const radius = 200
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius * 0.45  // flatten into an ellipse

              const perspX = (mousePosition.x - 0.5) * 18
              const perspY = (mousePosition.y - 0.5) * 18

              return (
                <div
                  key={image.id}
                  className="absolute w-32 h-40 sm:w-40 sm:h-52 transition-all duration-300"
                  style={{
                    transform: `translate(${x}px, ${y}px) rotateX(${perspY}deg) rotateY(${perspX}deg) rotateZ(${image.rotation}deg)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-pointer group"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }}
                    />
                    {/* Shine overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Text + CTA */}
        <div className="relative z-20 text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {title && (
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              {description}
            </p>
          )}
          <button
            onClick={onCtaClick}
            className={cn(
              "inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm",
              "bg-primary text-primary-foreground",
              "hover:shadow-lg hover:scale-105 transition-all duration-300",
              "active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "group",
            )}
          >
            {ctaText}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature cards */}
        <div className="relative z-20 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "text-center p-6 rounded-xl group",
                "bg-card/50 backdrop-blur-sm border border-border/50",
                "hover:bg-card/80 hover:border-border transition-all duration-300",
              )}
            >
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
