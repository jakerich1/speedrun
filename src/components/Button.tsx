import { type FC } from "react";

type ButtonProps = {
  onClick: () => void;
  children: string;
  loading?: boolean;
};

const Button: FC<ButtonProps> = ({ onClick, children, loading = false }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      e.preventDefault(); // Prevent onClick from firing when loading
      return;
    }
    onClick(); // Call the onClick if not loading
  };

  return (
    <button
      onClick={handleClick}
      type="submit"
      name="commit"
      disabled={loading} // Disable button while loading
      style={{
        color: "#FFF",
        fontWeight: 500,
        fontSize: "16px",
        padding: "4px 8px",
        borderRadius: "8px",
        minWidth: "32px",
        backgroundColor: "rgb(48, 48, 48)",
        boxShadow: "rgba(26, 26, 26, 0.07) 0px 3px 1px -1px",
        cursor: loading ? "not-allowed" : "pointer", // Adjust cursor when loading
      }}
    >
      {loading ? (
        <div
          style={{
            border: "2px solid #fff",
            borderRadius: "50%",
            borderTop: "2px solid transparent",
            minWidth: "20px",
            height: "20px",
            animation: "spin 1s linear infinite",
          }}
        />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
