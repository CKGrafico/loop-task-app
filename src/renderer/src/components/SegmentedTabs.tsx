import type { Section } from "../types";

const SECTIONS: { key: Section; label: string; glyph: string }[] = [
  { key: "loops", label: "Loops", glyph: "↻" },
  { key: "tasks", label: "Tasks", glyph: "≔" },
  { key: "projects", label: "Projects", glyph: "▣" },
];

/** Segmented pill switcher for the sections within an instance. */
export function SegmentedTabs(props: {
  active: Section;
  onChange: (section: Section) => void;
  disabled?: boolean;
}): React.ReactNode {
  const { active, onChange, disabled } = props;

  return (
    <div className={`segmented${disabled ? " disabled" : ""}`}>
      {SECTIONS.map((section) => (
        <button
          key={section.key}
          className={`segment${section.key === active ? " active" : ""}`}
          onClick={() => !disabled && onChange(section.key)}
        >
          <span className="glyph">{section.glyph}</span>
          <span>{section.label}</span>
        </button>
      ))}
    </div>
  );
}
