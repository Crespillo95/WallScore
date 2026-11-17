/* Shared by the Lens and its guide. Origin is the left edge at floor level, in cm. */
(function (root) {
  "use strict";

  function calculate(wall, center, gap, frames) {
    if (![wall, center, gap].every(Number.isFinite) || wall <= 0 || center <= 0 || gap < 0) {
      throw new RangeError("Revisa las medidas de la pared, el centro y la separación.");
    }
    if (!Array.isArray(frames) || frames.length !== 3) {
      throw new RangeError("Introduce exactamente tres marcos.");
    }
    for (const {width, height, inset} of frames) {
      if (![width, height, inset].every(Number.isFinite) || width <= 0 || height <= 0 ||
          inset < 0 || inset > height || height / 2 > center) {
        throw new RangeError("Comprueba las dimensiones, la altura sobre el suelo y el anclaje de cada marco.");
      }
    }
    const span = frames.reduce((sum, frame) => sum + frame.width, 0) + gap * (frames.length - 1);
    if (span > wall) throw new RangeError("El conjunto supera el ancho disponible de la pared.");
    let left = (wall - span) / 2;
    return frames.map(({width, height, inset}) => {
      const top = center + height / 2;
      const result = {left, width, height, top, x: left + width / 2, y: top - inset};
      left += width + gap;
      return result;
    });
  }

  if (typeof module === "object" && module.exports) module.exports = {calculate};
  else root.WallScore = {calculate};
})(typeof globalThis === "object" ? globalThis : this);
