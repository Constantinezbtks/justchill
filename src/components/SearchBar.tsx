interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <span className="search-icon">
        🔍
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Search movies..."
      />

      {value && (
        <button
          className="search-clear"
          onClick={() => onChange("")}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default SearchBar;