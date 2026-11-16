/* ============================================================================
   chart.js — THE LITTLE PROGRESS GRAPHS
   ============================================================================
   Draws a simple line graph as inline SVG. No charting library — it's about
   sixty lines of maths, and a library would be bigger than this whole site.

   It's used on the My Goals screen to show each goal over time, with a
   dashed line marking the target.

   HOW IT WORKS
     1. Work out the smallest and largest values we need to show (including
        the target, so the target line is always on screen).
     2. Turn each point into an x,y position inside the drawing area.
     3. Join them with a line, shade underneath it, and dot each point.

   The colours come from CSS variables, so the graph restyles itself when
   the mode changes just like everything else.
   ========================================================================== */

MM.chart = (function () {

  var WIDTH = 320;      // drawing units, not pixels — the SVG scales to fit
  var HEIGHT = 110;
  var PAD_LEFT = 6;
  var PAD_RIGHT = 6;
  var PAD_TOP = 10;
  var PAD_BOTTOM = 18;

  /* --------------------------------------------------------------------------
     points:  [{ date, value }] oldest first
     options: { target, goingDown, unit, formatValue }
     Returns an SVG string, or a short message when there's nothing to draw.
     -------------------------------------------------------------------------- */
  function line(points, options) {
    var opts = options || {};

    if (!points || points.length < 2) {
      return '<p class="chart-empty">' +
        'Not enough yet to draw a line. Update this goal a couple more times ' +
        'and the graph will appear.' +
        '</p>';
    }

    var values = points.map(function (p) { return p.value; });
    var target = typeof opts.target === 'number' ? opts.target : null;

    // The target has to be inside the range, or its line would sit off-screen.
    var lowest = Math.min.apply(null, values);
    var highest = Math.max.apply(null, values);
    if (target !== null) {
      lowest = Math.min(lowest, target);
      highest = Math.max(highest, target);
    }

    // A completely flat line would divide by zero, so give it some room.
    if (highest === lowest) {
      highest = lowest + 1;
      lowest = Math.max(0, lowest - 1);
    }

    var innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
    var innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

    function xAt(index) {
      if (points.length === 1) return PAD_LEFT + innerW / 2;
      return PAD_LEFT + (index / (points.length - 1)) * innerW;
    }
    function yAt(value) {
      var fraction = (value - lowest) / (highest - lowest);
      return PAD_TOP + (1 - fraction) * innerH;   // SVG y grows downward
    }

    var coords = points.map(function (p, i) {
      return { x: xAt(i), y: yAt(p.value), point: p };
    });

    var linePath = coords.map(function (c, i) {
      return (i === 0 ? 'M' : 'L') + round(c.x) + ' ' + round(c.y);
    }).join(' ');

    // The shaded area is the same line, closed along the bottom.
    var areaPath = linePath +
      ' L' + round(coords[coords.length - 1].x) + ' ' + round(HEIGHT - PAD_BOTTOM) +
      ' L' + round(coords[0].x) + ' ' + round(HEIGHT - PAD_BOTTOM) + ' Z';

    var targetLine = '';
    if (target !== null) {
      var ty = round(yAt(target));
      targetLine =
        '<line class="chart-target" x1="' + PAD_LEFT + '" y1="' + ty +
          '" x2="' + (WIDTH - PAD_RIGHT) + '" y2="' + ty + '"/>' +
        '<text class="chart-target-label" x="' + (WIDTH - PAD_RIGHT) + '" y="' +
          round(ty - 4) + '" text-anchor="end">target ' + esc(fmt(target, opts)) + '</text>';
    }

    var dots = coords.map(function (c, i) {
      var isLast = i === coords.length - 1;
      return '<circle class="chart-dot' + (isLast ? ' is-last' : '') + '" cx="' +
        round(c.x) + '" cy="' + round(c.y) + '" r="' + (isLast ? 4 : 2.5) + '">' +
        '<title>' + esc(MM.dates.shortLabel(c.point.date)) + ': ' +
        esc(fmt(c.point.value, opts)) + '</title>' +
        '</circle>';
    }).join('');

    // Just the two end dates, so the axis never gets crowded.
    var firstDate = MM.dates.shortLabel(points[0].date);
    var lastDate = MM.dates.shortLabel(points[points.length - 1].date);

    return '' +
      '<svg class="chart" viewBox="0 0 ' + WIDTH + ' ' + HEIGHT + '" ' +
           'role="img" aria-label="' + esc(describe(points, opts)) + '">' +
        '<path class="chart-area" d="' + areaPath + '"/>' +
        targetLine +
        '<path class="chart-line" d="' + linePath + '"/>' +
        dots +
        '<text class="chart-axis" x="' + PAD_LEFT + '" y="' + (HEIGHT - 4) + '">' +
          esc(firstDate) + '</text>' +
        '<text class="chart-axis" x="' + (WIDTH - PAD_RIGHT) + '" y="' + (HEIGHT - 4) +
          '" text-anchor="end">' + esc(lastDate) + '</text>' +
      '</svg>';
  }

  /* ---- Small helpers ----------------------------------------------------- */

  // Keep the SVG path strings short and readable.
  function round(n) {
    return Math.round(n * 10) / 10;
  }

  function fmt(value, opts) {
    var rounded = Math.round(value * 10) / 10;
    return opts.unit ? rounded + ' ' + opts.unit : String(rounded);
  }

  // Read out to a screen reader, which can't see the line.
  function describe(points, opts) {
    var first = points[0].value;
    var last = points[points.length - 1].value;
    var direction = last > first ? 'up from' : (last < first ? 'down from' : 'level at');

    return 'Progress graph: ' + points.length + ' points, ' +
      direction + ' ' + fmt(first, opts) +
      (last === first ? '' : ' to ' + fmt(last, opts)) +
      (typeof opts.target === 'number' ? ', target ' + fmt(opts.target, opts) : '') + '.';
  }

  function esc(text) {
    return MM.ui ? MM.ui.esc(text) : String(text);
  }

  return { line: line };
})();
