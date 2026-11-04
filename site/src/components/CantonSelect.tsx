import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { CantonOption } from "../lib/data";

type CantonSelectProps = {
  options: CantonOption[];
  value: string;
  onChange: (key: string) => void;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`chevron${open ? " is-open" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

export function CantonSelect({ options, value, onChange }: CantonSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.key === value) ?? options[0];

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return options;
    return options.filter((option) =>
      normalize(`${option.canton} ${option.provincia}`).includes(term),
    );
  }, [options, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CantonOption[]>();
    for (const option of filtered) {
      const group = map.get(option.provincia) ?? [];
      group.push(option);
      map.set(option.provincia, group);
    }
    return [...map.entries()];
  }, [filtered]);

  const flatOptions = useMemo(
    () => groups.flatMap(([, items]) => items),
    [groups],
  );

  const indexByKey = useMemo(
    () => new Map(flatOptions.map((option, index) => [option.key, index])),
    [flatOptions],
  );

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`canton-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const select = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  const toggle = () => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
    setOpen((current) => !current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = flatOptions[activeIndex];
      if (option) select(option.key);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="select" ref={rootRef}>
      <button
        type="button"
        className="select-trigger"
        aria-label="Seleccionar cantón"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="canton-listbox"
        onClick={toggle}
      >
        <span className="select-value">
          <span className="select-canton">
            {selected?.canton ?? "Seleccione un cantón"}
          </span>
          <span className="select-province">
            {selected?.provincia ?? "Costa Rica"}
          </span>
        </span>
        <Chevron open={open} />
      </button>

      {open ? (
        <div className="select-popover">
          <div className="select-search">
            <SearchIcon />
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Buscar cantón o provincia"
              aria-label="Buscar cantón"
              role="combobox"
              aria-expanded="true"
              aria-controls="canton-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                flatOptions[activeIndex]
                  ? `canton-option-${activeIndex}`
                  : undefined
              }
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div
            id="canton-listbox"
            className="select-list"
            role="listbox"
            aria-label="Cantones"
          >
            {groups.map(([province, items]) => (
              <div
                key={province}
                className="select-group"
                role="group"
                aria-label={province}
              >
                <p className="select-group-label">{province}</p>
                {items.map((option) => {
                  const index = indexByKey.get(option.key) ?? 0;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={option.key}
                      id={`canton-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={option.key === value}
                      className={[
                        "select-option",
                        isActive ? "is-active" : "",
                        option.key === value ? "is-selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(option.key)}
                    >
                      <span>{option.canton}</span>
                      <span className="option-province">
                        {option.provincia}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

            {flatOptions.length === 0 ? (
              <p className="select-empty">No se encontró un cantón.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
