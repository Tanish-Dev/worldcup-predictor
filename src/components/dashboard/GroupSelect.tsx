"use client";

export default function GroupSelect({
  groups,
  value,
  onChange,
}: {
  groups: string[];
  value: string;
  onChange: (group: string) => void;
}) {
  return (
    <select
      className="wc-select shrink-0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select group"
    >
      {groups.map((g) => (
        <option key={g} value={g}>
          GROUP {g}
        </option>
      ))}
    </select>
  );
}
