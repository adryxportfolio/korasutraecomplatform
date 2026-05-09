import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showMarks?: boolean;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showMarks = false, min = 0, max = 100, value, defaultValue, ...props }, ref) => {
  // Determine if this is a range slider (two thumbs) based on value/defaultValue
  const isRange = Array.isArray(value) ? value.length > 1 : Array.isArray(defaultValue) ? defaultValue.length > 1 : false;
  
  return (
    <div className="relative w-full">
      {/* Min/Max marks above the slider */}
      {showMarks && (
        <div className="flex justify-between mb-2 text-xs text-muted-foreground font-price">
          <span>₹{Number(min).toLocaleString()}</span>
          <span>₹{Number(max).toLocaleString()}</span>
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        min={min}
        max={max}
        value={value}
        defaultValue={defaultValue}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {/* Render thumbs based on whether it's a range or single slider */}
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        {isRange && (
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        )}
      </SliderPrimitive.Root>
    </div>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
