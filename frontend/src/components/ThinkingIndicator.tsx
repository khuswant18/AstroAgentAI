export default function ThinkingIndicator() {
  return (
    <div className="flex flex-col items-start animate-fade-in w-full">
      <div className="flex items-start gap-2 max-w-[85%] md:max-w-[75%]">
        <div className="mt-1 flex-shrink-0 text-[#f0b95b] text-[8px]">
          ✦
        </div>
        
        <div className="flex flex-col w-full">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(240,185,91,0.1)] rounded-[4px_18px_18px_18px] p-[14px_18px] shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-1.5 h-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f0b95b] animate-pulse-scale" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#f0b95b] animate-pulse-scale" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#f0b95b] animate-pulse-scale" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <div className="text-[11px] text-[#6b6580] font-body italic">
              reading the stars...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
