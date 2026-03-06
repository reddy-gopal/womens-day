import React, { useState } from "react";
import { cardToBlob, shareToWhatsApp, saveAllCards } from "./buttons/ShareHandler";

/**
 * SelectedBar.jsx
 * Sticky bottom bar showing selected card count with Save and Share buttons.
 *
 * Props:
 *  - selectedCards: array of { card, ref } in selection order
 *  - onClearAll: function() — clears all selections
 */
const SelectedBar = ({ selectedCards, onClearAll }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'save' | 'share'

  if (selectedCards.length === 0) return null;

  const getBlobsInOrder = async () => {
    const blobs = [];
    for (const { ref } of selectedCards) {
      if (ref?.current) {
        const blob = await cardToBlob(ref.current);
        blobs.push(blob);
      }
    }
    return blobs;
  };

  const handleSave = async () => {
    setIsLoading(true);
    setLoadingAction("save");
    try {
      const blobs = await getBlobsInOrder();
      saveAllCards(blobs);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save cards. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleShare = async () => {
    setIsLoading(true);
    setLoadingAction("share");
    try {
      const blobs = await getBlobsInOrder();
      await shareToWhatsApp(blobs);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTop: "1px solid #eee",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.10)",
        zIndex: 100,
        gap: "12px",
      }}
    >
      {/* Left: count + clear */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#c0396b",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {selectedCards.length}
        </div>
        <span style={{ fontSize: "14px", color: "#444" }}>
          card{selectedCards.length > 1 ? "s" : ""} selected
        </span>
        <button
          onClick={onClearAll}
          style={{
            background: "none",
            border: "none",
            color: "#999",
            fontSize: "13px",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          Clear
        </button>
      </div>

      {/* Right: Save + Share buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleSave}
          disabled={isLoading}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "2px solid #c0396b",
            backgroundColor: "#fff",
            color: "#c0396b",
            fontWeight: 600,
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading && loadingAction === "save" ? 0.7 : 1,
          }}
        >
          {isLoading && loadingAction === "save" ? "Saving..." : "💾 Save"}
        </button>

        <button
          onClick={handleShare}
          disabled={isLoading}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#25D366",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading && loadingAction === "share" ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isLoading && loadingAction === "share" ? "Preparing..." : "Share on WhatsApp"}
        </button>
      </div>
    </div>
  );
};

export default SelectedBar;