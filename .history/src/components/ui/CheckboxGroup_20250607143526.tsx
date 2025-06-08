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
    onChange(exists ? selected.filter((v) => v !== value) : [value]); // forçando único
  };

  return (
    <GroupWrapper>
      {options.map(({ label, value }) => (
        <Item key={value}>
          {label}
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
