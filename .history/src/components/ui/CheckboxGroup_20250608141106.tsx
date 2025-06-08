import styled from "styled-components";

// ✅ Ajuste o container para impedir quebra e alinhar horizontalmente


interface CheckboxGroupProps {
  options: { linhaCima: string; linhaBaixo: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}
export const CheckboxGroup = ({ options, selected, onChange }: CheckboxGroupProps) => {
  const toggle = (value: string) => {
    const alreadySelected = selected.includes(value);
    onChange(alreadySelected ? selected.filter((v) => v !== value) : [value]); // única seleção
  };

  return (
    <GroupWrapper>
      {options.map(({ label, value }) => (
        <Item key={value}>
          <span>{label}</span>
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => toggle(value)}
          />
        </Item>
      ))}
    </GroupWrapper>
  );
};
