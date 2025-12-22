'use client';

export default function Canvas() {
  return (
    <div className="flex-1 relative overflow-auto">
      {/* Canvas Surface with generous padding */}
      <div className="p-8 min-h-full">
        <div
          className="relative min-h-[800px] w-full mx-auto max-w-7xl rounded-sm"
          style={{
            background: '#FAFAF8',
            backgroundImage: `
              linear-gradient(to right, #EEEEEB 1px, transparent 1px),
              linear-gradient(to bottom, #EEEEEB 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Content Area */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <p className="text-foreground/40 text-sm">Canvas will go here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

