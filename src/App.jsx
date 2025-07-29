import React from "react";
import OsintTree from "./OsintGraph";
import "./App.css";

function App() {
  const toggleDarkMode = () => {
    document.body.classList.toggle("dark-Mode");
  };

  return (
    <div id="body">
      <div id="header-container">
        <div id="header">Performance Measures</div>

        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
          <span className="toggle-icon">🌓</span>
        </button>
      </div>
      <hr />
      <OsintTree />
    </div>
  );
}

export default App;
