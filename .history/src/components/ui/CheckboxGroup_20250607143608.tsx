import styled from "styled-components";

// ✅ Ajuste o container para impedir quebra e alinhar horizontalmente
const GroupWrapper = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 24px;
  overflow-x: auto;
  padding: 4px 0;
`;

// ✅ Organiza cada item em coluna: texto em cima, caixa embaixo
const Item = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 13px;
  color: #0d47a1;
  cursor: pointer;
  min-width: 70px;
  text-align: center;

  span {
    margin-bottom: 4px;
    white-space: nowrap;
  }

  input {
    width: 18px;
    height: 18px;
  }
`;

interface CheckboxGroupProps {
  options: { label: string; value: string }[];
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
