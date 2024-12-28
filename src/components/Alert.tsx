import { type FC } from "react";

type ErrorAlertProps = {
  message: string;
};

const ErrorAlert: FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div
      style={{
        borderRadius: "8px",
        backgroundColor: "rgb(255, 235, 235)",
        border: "1px solid rgb(228, 94, 94)",
        fontSize: "16px",
        fontWeight: 500,
        padding: "8px 12px",
        minHeight: "32px",
        width: "100%",
        textAlign: "left",
        marginBottom: "16px",
      }}
    >
      {message}
    </div>
  );
};

export default ErrorAlert;
