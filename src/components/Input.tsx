import { type FC } from "react";

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

const Input: FC<InputProps> = ({ value, onChange, placeholder }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        appearance: "none",
        borderRadius: "8px",
        border: "1px solid rgb(209, 209, 209)",
        boxShadow: "rgba(26, 26, 26, 0.07) 0px 3px 1px -1px",
        boxSizing: "border-box",
        color: "rgb(48, 48, 48)",
        fontSize: "16px",
        fontWeight: 500,
        padding: "8px 12px",
        minHeight: "32px",
        width: "100%",
        textAlign: "left",
        verticalAlign: "middle",
        outline: "none",
      }}
    />
  );
};

export default Input;
