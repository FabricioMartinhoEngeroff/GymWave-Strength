import styled from "styled-components";

const GroupWrapper = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const Item = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 13px;
  color: #0d47a1;
  gap: 4px;
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
  }
`;

export const CheckboxGroup = ({
  options,
  selected,
  onChange,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) => {
  const toggle = (value: string) => {
    const exists = selected.includes(value);
    onChange(exists ? selected.filter((v) => v !== value) : [value]); // força seleção única
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
