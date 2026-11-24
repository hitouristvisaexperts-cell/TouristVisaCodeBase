import React from 'react'

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  blobColor?: string
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className = '', blobColor = '#2563EB', style, onClick, ...props }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      style={style}
      className={[
        'group relative cursor-pointer overflow-hidden rounded-full',
        'border bg-transparent',
        'px-5 py-2.5 text-center text-sm font-bold',
        'transition-all duration-300',
        className,
      ].join(' ')}
      {...props}
    >
      {/* Original text slides out */}
      <span className="relative z-10 inline-flex items-center gap-2 translate-x-0 transition-all duration-300 group-hover:translate-x-10 group-hover:opacity-0">
        {children}
      </span>

      {/* New text + arrow slides in (always white because blob fills bg) */}
      <div className="absolute top-0 z-20 flex h-full w-full -translate-x-10 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 text-sm font-bold">
        {children}
        <svg
          width="14" height="14"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="shrink-0"
        >
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>

      {/* Expanding blob that fills button on hover */}
      <div
        className="absolute left-[28%] top-[35%] h-2.5 w-2.5 scale-100 rounded-full transition-all duration-500 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[2] z-10"
        style={{ background: blobColor }}
      />
    </button>
  )
})

InteractiveHoverButton.displayName = 'InteractiveHoverButton'
