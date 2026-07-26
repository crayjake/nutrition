interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="segmented-field">
      <legend className="sr-only">{label}</legend>
      <div className="segmented-control" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className="segmented-option"
            data-active={value === option.value}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.hint && <small>{option.hint}</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
