import styled from "styled-components";

const GroupWrapper = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  margin-right: 16px;
  font-size: 14px;
`;

export const CheckboxGroup = ({ label, options, selected, onChange }: {
  label: string;
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) => {
  const toggle = (value: string) => {
    const exists = selected.includes(value);
    onChange(exists ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <GroupWrapper>
      <div>{label}</div>
      {options.map(({ label, value }) => (
        <Label key={value}>
          <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} /> {label}
        </Label>
      ))}
    </GroupWrapper>
  );
};