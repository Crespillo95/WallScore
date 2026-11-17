/* Centimetres, viewed from the front. The wall origin is its left edge at floor level. */
(function (root) {
  "use strict";
  function fail(code, message, frame) {
    const error = new RangeError(message);
    error.code = code;
    error.frame = frame;
    throw error;
  }
  function finiteBetween(value, min, max) {
    return Number.isFinite(value) && value >= min && value <= max;
  }
  // Permit only arithmetic round-off at a boundary (e.g. 0.1 + 0.2).
  function exceeds(value, limit) {
    return value - limit > Math.max(Math.abs(value), Math.abs(limit)) * Number.EPSILON * 4;
  }
  function calculate(wall, center, gap, frames, ceiling) {
    if (![wall, center, gap].every(Number.isFinite) || wall <= 0 || center <= 0 || gap < 0 ||
        (ceiling != null && (!Number.isFinite(ceiling) || ceiling <= 0))) {
      fail("wall", "Revisa el ancho de la pared, las alturas y la separación.");
    }
    if (!Array.isArray(frames) || frames.length !== 3) {
      fail("count", "Introduce exactamente tres marcos.");
    }
    const result = [];
    let span = gap * 2;
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!frame || ![frame.width, frame.height].every(v => Number.isFinite(v) && v > 0)) {
        fail("size", "Introduce un ancho y un alto mayores que cero.", i);
      }
      const {width, height} = frame;
      const top = center + height / 2;
      if (exceeds(height / 2, center)) fail("floor", "El marco quedaría por debajo del suelo.", i);
      if (!Number.isFinite(top) || (ceiling != null && exceeds(top, ceiling))) {
        fail("ceiling", "El borde superior supera la altura disponible.", i);
      }
      const hooks = frame.hooks === undefined ? [{fromLeft: width / 2, inset: frame.inset}] : frame.hooks;
      if (!Array.isArray(hooks) || hooks.length < 1 || hooks.length > 2) {
        fail("hardware", "Indica uno o dos puntos de apoyo.", i);
      }
      for (const hook of hooks) {
        if (!hook || !finiteBetween(hook.fromLeft, 0, width) || !finiteBetween(hook.inset, 0, height)) {
          fail("hook", "Cada apoyo debe quedar dentro de los bordes del marco.", i);
        }
      }
      if (hooks.length === 2 && hooks[0].fromLeft >= hooks[1].fromLeft) {
        fail("order", "El segundo apoyo debe quedar a la derecha del primero en la vista frontal.", i);
      }
      result.push({width, height, top, hooks});
      span += width;
    }
    if (!Number.isFinite(span) || exceeds(span, wall)) fail("span", "El conjunto supera el ancho útil de la pared.");
    let left = Math.max(0, (wall - span) / 2);
    return result.map(frame => {
      const hooks = frame.hooks.map(hook => ({x: left + hook.fromLeft, y: Math.max(0, frame.top - hook.inset)}));
      const placed = {left, width: frame.width, height: frame.height, top: frame.top,
        centerX: left + frame.width / 2, hooks, x: hooks[0].x, y: hooks[0].y};
      left += frame.width + gap;
      return placed;
    });
  }
  if (typeof module === "object" && module.exports) module.exports = {calculate};
  else root.WallScore = {calculate};
})(typeof globalThis === "object" ? globalThis : this);
