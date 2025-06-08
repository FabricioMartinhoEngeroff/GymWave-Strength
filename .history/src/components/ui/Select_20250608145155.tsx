import Select from "react-select";
import styled from "styled-components";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: Option | null;
  onChange: (value: Option | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  label?: string;
}

const FieldWrapper = styled.div`
  width: 100%;
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 4px; // ❗️Esse define a distância para o Select
    font-weight: bold;
    color: #004080;
    font-size: 15px;
  }
`;

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isDisabled,
  label,
}) => {
  return (
    <FieldWrapper>
      {label && <label>{label}</label>}
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Selecione..."}
        isDisabled={isDisabled}
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: 8,
            borderColor: "#0066cc",
            marginTop: 0,           // ✅ reduz espaço vertical
            paddingTop: 1,          // ✅ mais compacto
            paddingBottom: 2,
            minHeight: 38          
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#e6f0ff" : "white",
            color: "#000",
          }),
        }}
      />
    </FieldWrapper>
  );
};
