import { useEffect, useRef } from "react";
import { plot, type PlotOptions } from "@observablehq/plot";

type PlotFigureProps = {
  options: PlotOptions;
  ariaLabel: string;
  className?: string;
};

export function PlotFigure({
  options,
  ariaLabel,
  className,
}: PlotFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const render = () => {
      const width = Math.max(240, Math.floor(container.clientWidth));
      const customStyle =
        options.style && typeof options.style === "object"
          ? options.style
          : {};

      const svg = plot({
        ...options,
        width,
        style: {
          background: "transparent",
          color: "var(--text)",
          ...customStyle,
        },
      });

      container.replaceChildren(svg);
    };

    render();

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(render);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      container.replaceChildren();
    };
  }, [options]);

  return (
    <div
      ref={containerRef}
      className={["plot", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
