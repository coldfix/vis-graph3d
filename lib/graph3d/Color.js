////////////////////////////////////////////////////////////////////////////////
// Colormap utilities for Graph3d.
//
////////////////////////////////////////////////////////////////////////////////
import util from 'vis-util';


/**
 * Parse color into an {r, g, b} object.
 *
 * @param {Array | Object | string} color
 * @returns {Object} color as {r, g, b} object
 */
function parseColor(color) {
  if (typeof color === 'object') {
    return color;
  }
  if (Array.isArray(color)) {
    const [r, g, b] = color;
    return {r, g, b};
  }
  if (typeof color === 'string') {
    if (util.isValidHex(color)) {
      return util.hexToRGB(color);
    }
    if (util.isValidRGB(color)) {
      const [r, g, b] = color
        .substr(4, color.length - 5)
        .split(",")
        .map(v => parseInt(v));
      return {r, g, b};
    }
  }
  throw new Error('Unsupported type of color:', color);
}


/**
 * Parse color into an {h, s, v} object.
 *
 * @param {Array | Object | string} color
 * @returns {Object} color as {r, g, b} object
 */
function parseHSV(color) {
  if (typeof color === 'object' && color.h !== undefined) {
    var {h, s, v} = color;
    if (s === undefined) {
      s = 1;
    }
    if (v === undefined) {
      v = 1;
    }
    return {h, s, v};
  }
  var {r, g, b} = parseColor(color);
  return util.RGBToHSV(r, g, b);
}



/**
 * Sample RGB values at evenly spaced locations within [0, 1].
 *
 * @param {function} colormap
 * @param {number} stops must be >= 2
 * @returns {Array} [{r, g, b}...]
 */
function freeze(colormap, stops) {
  let colors = [];
  for (let i = 0; i < stops; ++i) {
    colors.push(colormap(i / (stops - 1)));
  }
  return colors;
}


/**
 * Returns a colormap function that interpolates between two colors in HSV space.
 *
 * @param {Object} start HSV values {h, s, v}
 * @param {Object} end HSV values {h, s, v}
 * @returns {function}
 */
function interpolateHSV(start, end) {
  const {h: h0, s: s0, v: v0} = parseHSV(start);
  const {h: h1, s: s1, v: v1} = parseHSV(end);
  const dh = h1 - h0;
  const ds = s1 - s0;
  const dv = v1 - v0;
  return function(x) {
    let hue = (h0 + dh * x) % 1;
    let sat = s0 + ds * x;
    let val = v0 + dv * x;
    return util.HSVToRGB(hue < 0 ? hue + 1 : hue, sat, val);
  }
}


/**
 * Returns a colormap function that interpolates between two colors in RGB space.
 *
 * @param {Object} start RGB values {r, g, b}
 * @param {Object} end RGB values {r, g, b}
 * @returns {function}
 */
function interpolateRGB(start, end) {
  const {r: r0, g: g0, b: b0} = parseColor(start);
  const {r: r1, g: g1, b: b1} = parseColor(end);
  const dr = r1 - r0;
  const dg = g1 - g0;
  const db = b1 - b0;
  return function(x) {
    const r = r0 + x*dr;
    const g = g0 + x*dg;
    const b = b0 + x*db;
    return {r, g, b};
  };
}


/**
 * Concatenate the given colormaps.
 *
 * @param {Array} colormaps
 * @returns {function}
 */
function concat(colormaps) {
  const len = colormaps.length;
  return function(x) {
    const index = Math.min(Math.max(Math.floor(x * len), 0), len-1);
    return colormaps[index](x * len - index);
  };
}


/**
 * Returns a colormap function based on the linear interpolation between the
 * given color stops.
 *
 * @param {Array} colors
 * @param {string | function} mode defaults to 'rgb'
 * @returns {function}
 */
function interpolate(colors, mode) {
  if (colors.length < 2) {
    throw new Error('Colors array length must be 2 or above.');
  }
  let interpolate;
  if (mode === 'rgb' || mode === undefined) {
    interpolate = interpolateRGB;
  } else if (mode === 'hsv') {
    interpolate = interpolateHSV;
  } else if (typeof mode === 'function') {
    interpolate = mode;
  } else {
    throw new Error('Unknown interpolatation mode:', mode);
  }
  return concat(map_pairs(colors, interpolate));
}


/**
 * Returns a colormap function that runs on an arc in the HSV coordinate space
 * by going from hueStart to hueEnd.
 *
 * @param {number} hueStart Hue start value
 * @param {number} hueEnd Hue end value
 * @param {number} saturation defaults to 1
 * @param {number} brightness defaults to 1
 * @returns {function}
 */
function hueArc(hueStart, hueEnd, saturation, brightness) {
  if (saturation === undefined) {
    saturation = 1;
  }
  if (brightness === undefined) {
    brightness = 1;
  }
  return interpolateHSV(
    {h: hueStart/360, s: saturation, v: brightness},
    {h: hueEnd/360, s: saturation, v: brightness});
}


/**
 * Maps a function over all pairs of adjacent elements in an array.
 *
 * @param {Array} arr
 * @param {function} fn
 * @returns {Array}
 */
function map_pairs(arr, fn) {
  let results = [];
  for (var i=0; i < arr.length - 1; i++){
      results.push(fn(arr[i], arr[i + 1]));
  }
  return results;
}


export {
  parseColor,
  freeze,
  interpolateHSV,
  interpolateRGB,
  interpolate,
  concat,
  hueArc,
};
