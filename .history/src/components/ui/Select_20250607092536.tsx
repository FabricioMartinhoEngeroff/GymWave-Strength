import Select from "react-select";

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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder, isDisabled }) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder || "Selecione..."}
      isDisabled={isDisabled}
      styles={{
        control: (base) => ({ ...base, borderRadius: 8, borderColor: "#0066cc" }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? "#e6f0ff" : "white",
          color: "#000",
        })
      }}
    />
  );
};