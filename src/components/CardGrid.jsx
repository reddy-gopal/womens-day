import React from "react";
import CardItem from "./CardItem";

/**
 * CardGrid.jsx
 * Renders all cards in a responsive grid layout.
 *
 * Props:
 *  - cards: array of card objects
 *  - selectedCards: array of { card, ref } in selection order
 *  - onToggle: function(card, ref) — passed down to each CardItem
 */
const CardGrid = ({ cards, selectedCards, onToggle }) => {
  const getSelectionOrder = (cardId) => {
    const index = selectedCards.findIndex((s) => s.card.id === cardId);
    return index === -1 ? null : index + 1;
  };

  const isSelected = (cardId) => {
    return selectedCards.some((s) => s.card.id === cardId);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
        padding: "16px",
      }}
    >
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          isSelected={isSelected(card.id)}
          selectionOrder={getSelectionOrder(card.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};

export default CardGrid;