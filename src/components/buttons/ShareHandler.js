/**
 * ShareHandler.js
 * Handles Web Share API logic for sharing cards to WhatsApp
 */

/**
 * Converts a card (rendered as canvas) to a Blob
 */
export async function cardToBlob(cardElement) {
    // Dynamically import html2canvas
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardElement, {
      useCORS: true,
      backgroundColor: null,
      scale: 2,
    });
  
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }
  
  /**
   * Share selected cards via Web Share API
   * @param {Blob[]} blobs - Array of image blobs in selected order
   */
  export async function shareToWhatsApp(blobs) {
    if (!navigator.share) {
      alert("Sharing is not supported on this browser. Please use Chrome on Android or Safari on iPhone.");
      return;
    }
  
    const files = blobs.map(
      (blob, index) =>
        new File([blob], `womens-day-card-${index + 1}.png`, { type: "image/png" })
    );
  
    const canShareFiles = navigator.canShare && navigator.canShare({ files });
  
    if (!canShareFiles) {
      alert("Your browser does not support sharing images directly. Please try on mobile.");
      return;
    }
  
    try {
      await navigator.share({
        files,
        title: "Happy Women's Day! 🌸",
        text: "Wishing you a Happy Women's Day! 💜",
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
        alert("Something went wrong while sharing. Please try again.");
      }
    }
  }
  
  /**
   * Save a single card as an image download
   * @param {Blob} blob
   * @param {number} index
   */
  export function downloadCard(blob, index) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `womens-day-card-${index + 1}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * Save all selected cards
   * @param {Blob[]} blobs
   */
  export function saveAllCards(blobs) {
    blobs.forEach((blob, index) => {
      setTimeout(() => downloadCard(blob, index), index * 300);
    });
  }