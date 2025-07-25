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
        <div id="header">Minimal Design</div>
        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
          <span className="toggle-icon">🌓</span>
        </button>
      </div>
      <OsintTree />
      <footer id="footer">
        <div className="footer-content">
          <p>
            &copy; 2025 Minimal Design. Open Source Intelligence Tools &
            Resources.
          </p>
          <p>
            <span>Built with React & D3.js</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
