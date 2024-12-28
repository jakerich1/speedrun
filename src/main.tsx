import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

const widgetContainer = document.querySelector("#react-app");

if (!widgetContainer) {
  throw new Error("Widget container not found");
}

// Render the React app inside the widget container
createRoot(widgetContainer).render(<App />);
