import styled from "styled-components";

const Dropdown = styled.select`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  background-color: #fff;
  border: 1px solid #b0bec5; /* borda cinza-azulada */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    outline: none;
  }
`;

export const PesoPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const pesos = Array.from({ length: 201 }, (_, i) => i);
  return (
    <Dropdown value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {pesos.map((peso) => (
        <option key={peso} value={peso}>
          {peso} kg
        </option>
      ))}
    </Dropdown>
  );
};
