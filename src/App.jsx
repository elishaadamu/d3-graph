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

      <p className="footer-text">
        {" "}
        An integrated network, cost effective, multimodal transportation system
        that safely and efficiently moves people and goods throughout the region
        in an equitable and environmentally responsible manner to support
        economic prosperity and improved quality of life for all users.
      </p>
    </div>
  );
}

export default App;
