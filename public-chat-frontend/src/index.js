import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom"; // Import qilish

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* Ilovani BrowserRouter bilan o'rash */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

export default App;
