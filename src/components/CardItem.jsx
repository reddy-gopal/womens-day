import React, { useRef } from "react";

/**
 * CardItem.jsx
 * Renders a single Women's Day card.
 * Handles selection highlight and exposes ref for canvas capture.
 *
 * Props:
 *  - card: object { id, title, category, quote, bg, accent }
 *  - isSelected: boolean
 *  - selectionOrder: number | null (1-based order in which card was selected)
 *  - onToggle: function(card, ref) — called when card is tapped
 */
const CardItem = ({ card, isSelected, selectionOrder, onToggle }) => {
  const cardRef = useRef(null);

  const handleClick = () => {
    onToggle(card, cardRef);
  };

  return (
    <div
      className="card-item-wrapper"
      onClick={handleClick}
      style={{ position: "relative", cursor: "pointer" }}
    >
      {/* The actual card — this is what gets captured as image */}
      <div
        ref={cardRef}
        className="card-item"
        style={{
          backgroundColor: card.bg,
          border: isSelected ? `3px solid ${card.accent}` : "3px solid transparent",
          borderRadius: "16px",
          padding: "24px 20px",
          minHeight: "180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "transform 0.2s, box-shadow 0.2s",
          transform: isSelected ? "scale(0.97)" : "scale(1)",
          boxShadow: isSelected
            ? `0 0 0 4px ${card.accent}44, 0 8px 24px rgba(0,0,0,0.12)`
            : "0 4px 16px rgba(0,0,0,0.08)",
          userSelect: "none",
        }}
      >
        {/* Category tag */}
        <span
          style={{
            display: "inline-block",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: card.accent,
            backgroundColor: `${card.accent}18`,
            padding: "3px 10px",
            borderRadius: "999px",
            alignSelf: "flex-start",
          }}
        >
          {card.category}
        </span>

        {/* Quote */}
        <p
          style={{
            fontSize: "15px",
            lineHeight: "1.6",
            color: "#2a2a2a",
            fontStyle: "italic",
            margin: "12px 0",
            flexGrow: 1,
          }}
        >
          "{card.quote}"
        </p>

        {/* Title */}
        <p
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: card.accent,
            margin: 0,
          }}
        >
          — {card.title}
        </p>
      </div>

      {/* Selection overlay badge */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: card.accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 2,
          }}
        >
          {selectionOrder}
        </div>
      )}
    </div>
  );
};

export default CardItem;