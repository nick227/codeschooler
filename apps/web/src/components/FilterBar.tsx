interface FilterOption {
  label: string
  value: string
}

interface FilterBarProps {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

export function FilterBar({ label, options, value, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`filter-chip${value === option.value ? ' is-active' : ''}`}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
