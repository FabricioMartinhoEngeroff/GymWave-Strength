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

const Item = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 13px;
  color: #0d47a1;
  cursor: pointer;
  min-width: 80px;
  text-align: center;

  .linha-cima {
    style={{ marginTop: "0px", gap: "2px" }}
    font-weight: bold;
    margin-bottom: 2px;
    font-size: 14px;
    color: #0d47a1;
  }

  .linha-baixo {
    font-size: 12px;
    color: #555;
    margin-bottom: 6px;
    white-space: nowrap;
  }

  input {
    width: 18px;
    height: 18px;
  }
`;

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
      {options.map(({ linhaCima, linhaBaixo, value }) => (
        <Item key={value}>
          <div className="linha-cima">{linhaCima}</div>
          <div className="linha-baixo">{linhaBaixo}</div>
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