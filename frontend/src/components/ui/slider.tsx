import * as React from "react"

export interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className = "" }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      onValueChange?.([newValue]);
    }

    return (
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#f97316] ${className}`}
        style={{
          background: `linear-gradient(to right, #f97316 0%, #f97316 ${((value[0] - min) / (max - min)) * 100}%, #e2e8f0 ${((value[0] - min) / (max - min)) * 100}%, #e2e8f0 100%)`
        }}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }

