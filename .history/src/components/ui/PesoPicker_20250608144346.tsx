import styled from "styled-components";

const Dropdown = styled.select`
  padding: 10px;
  border-radius: 2px;
  border: 1px solid #0066cc;
  width: 100%;
  font-size: 16px;
`;

export const PesoPicker = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const pesos = Array.from({ length: 201 }, (_, i) => i);
  return (
    <Dropdown value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {pesos.map((peso) => (
        <option key={peso} value={peso}>{peso} kg</option>
      ))}
    </Dropdown>
  );
};