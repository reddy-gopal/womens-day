import React, { useState } from "react";
import CardGrid from "./components/CardGrid";
import SelectedBar from "./components/SelectedBar";
import cards from "./data/cards";

/**
 * App.jsx
 * Root component. Manages global selected cards state.
 * Renders header, CardGrid, and SelectedBar.
 */
const App = () => {
  // selectedCards: array of { card, ref } — order matters for WhatsApp share
  const [selectedCards, setSelectedCards] = useState([]);

  const handleToggle = (card, ref) => {
    setSelectedCards((prev) => {
      const exists = prev.find((s) => s.card.id === card.id);
      if (exists) {
        // Deselect
        return prev.filter((s) => s.card.id !== card.id);
      } else {
        // Select — append to maintain order
        return [...prev, { card, ref }];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedCards([]);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fdf6f8", fontFamily: "sans-serif" }}>
      {/* Header */}
      <header
        style={{
          padding: "24px 20px 12px",
          textAlign: "center",
          borderBottom: "1px solid #f0e0e8",
          backgroundColor: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "22px", color: "#c0396b", fontWeight: 700 }}>
          🌸 Women's Day Cards
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#888" }}>
          Select cards to share as WhatsApp Status
        </p>
      </header>

      {/* Card Grid */}
      <main style={{ paddingBottom: selectedCards.length > 0 ? "90px" : "24px" }}>
        <CardGrid
          cards={cards}
          selectedCards={selectedCards}
          onToggle={handleToggle}
        />
      </main>

      {/* Bottom Action Bar */}
      <SelectedBar
        selectedCards={selectedCards}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export default App;