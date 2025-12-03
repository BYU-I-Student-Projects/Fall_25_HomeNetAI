import * as React from "react"

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className = "" }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        ref={ref}
        onClick={() => onCheckedChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          checked ? 'bg-[#f97316]' : 'bg-slate-200'
        } ${className}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }

