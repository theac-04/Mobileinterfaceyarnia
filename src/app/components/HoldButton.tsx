import { useRef } from "react";

interface HoldButtonProps {
  onHold: () => void;
  children: React.ReactNode;
  className?: string;
}

export function HoldButton({ onHold, children, className }: HoldButtonProps) {
  const intervalIdRef = useRef<number | undefined>(undefined);
  // Always keep a live reference to the latest onHold callback.
  // Updating a ref during render is intentional here — it lets the
  // setInterval callback always invoke the freshest closure without
  // needing to restart the interval on every re-render.
  const onHoldRef = useRef(onHold);
  onHoldRef.current = onHold;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Fire immediately on press
    onHoldRef.current();

    // Clear any existing interval
    if (intervalIdRef.current !== undefined) {
      window.clearInterval(intervalIdRef.current);
    }

    // Continuously fire while held
    intervalIdRef.current = window.setInterval(() => {
      onHoldRef.current();
    }, 50);
  };

  const stopHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (intervalIdRef.current !== undefined) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = undefined;
    }
  };

  return (
    <button
      type="button"
      className={className}
      onPointerDown={handlePointerDown}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      style={{ touchAction: "none", userSelect: "none" }}
    >
      {children}
    </button>
  );
}