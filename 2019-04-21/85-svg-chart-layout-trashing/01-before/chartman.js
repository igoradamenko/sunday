;(function() {
  'use strict';

  var ROOT_CLASSNAME = 'chartman';

  // there is no signs in design that charts must be flexible by height, so let's fix it
  // anyway it's possible to change this variable later with params or by window resizing
  var BODY_HEIGHT = 300;

  // padding around whole chart that makes it possible to show edgy dots a bit outside of a chart
  var ROOT_PADDING = 4;

  var X_LABELS_HEIGHT = 24;
  var Y_LABELS_OFFSET = 6;

  var GRID_HEIGHT = BODY_HEIGHT - X_LABELS_HEIGHT;

  // we need to take care about strokes because they can overflow whole svg viewBox
  // so we add / subtract half of stroke-width to do it
  var STROKE_COMPENSATION = 1;
  var RANGE_STROKE_COMPENSATION = .5;

  var CHART_HEIGHT = GRID_HEIGHT - STROKE_COMPENSATION * 2;
  var RANGE_HEIGHT = 34;
  var RANGE_CHART_HEIGHT = RANGE_HEIGHT - RANGE_STROKE_COMPENSATION * 2;

  var HORIZONTAL_LINES_NUMBER = 6;

  var LINE_THICKNESS = 1;

  var RANGE_WINDOW_BORDER_WIDTH = 4;
  var MOBILE_RANGE_WINDOW_BORDER_WIDTH = RANGE_WINDOW_BORDER_WIDTH * 2; // just to make it possible to touch

  var GRID_UPDATE_DELAY = 100;

  var VERTICAL_LINE_ACCURACY = 10; // number of pixels before and after actual chart's dot that cause dot showing
  var POPUP_OFFSET = 8; // offset from vertical line

  var DEFAULT_THEME = 'day';

  var UA = navigator.userAgent.toLowerCase();

  // there is a bug in firefox that makes it impossible to use vector-effect attr on paths:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1247218, and IE & Edge also doesn't support it
  // so we use fallback for manual rewdrawing paths without animation
  // it covers ~6-7% browsers: https://caniuse.com/usage-table
  // TODO: try to redraw with manual animation, huh?
  var IS_OLD_BROWSER = UA.indexOf('firefox') > -1 || UA.indexOf('msie ') > -1 || UA.indexOf('trident/') > -1 || UA.indexOf('edge/') > -1;

  /**
   * Create instance of Chartman
   * @param {HTMLElement} root - Node for drawing a chart
   * @param {object} data - Chart data
   * @param {object} options - Options object (right now there is only key `theme` which sets current theme)
   * @constructor
   */
  function Chartman(root, data, options) {
    var self = this;
    options = options || {};

    self.currentTheme = options.theme || DEFAULT_THEME;

    root.classList.add(ROOT_CLASSNAME);
    root.classList.add(ROOT_CLASSNAME + '_theme_' + self.currentTheme);

    self.init(root, data, function() {
      self.drawChart();
      self.drawRange();
      self.drawGrid();
      self.drawPopup();
      self.initListeners();

      setTimeout(function() {
        self.show(); // TODO: should be run after all calculations!
      });
    });
  }

  /**
   * Change current theme
   * @param {string} theme - Name of the theme
   */
  Chartman.prototype.setTheme = function(theme) {
    var self = this;
    var themeClassPart = '_theme_';

    var oldTheme = self.currentTheme;
    self.nodes.root.classList.remove(ROOT_CLASSNAME + themeClassPart + oldTheme);
    self.nodes.root.classList.add(ROOT_CLASSNAME + themeClassPart + theme);

    self.currentTheme = theme;
  };

  /**
   * Calculate main data and create main HTML and SVG nodes
   * @param {HTMLElement} root - Node for drawing a chart
   * @param {object} data - Chart data
   * @param {function} cb - Callback that will be fired at the end of calculations
   */
  Chartman.prototype.init = function(root, data, cb) {
    var self = this;

    // save init version of data for future
    self.data = data;

    // object with refs to main nodes
    self.nodes = {
      root: root
    };

    // object with nodes bounds
    self.bounds = {};

    // object with timers
    self.timers = {};

    // object with refs to svg paths of chart and range
    self.paths = {
      chart: {},
      range: {}
    };

    // object with lines data
    self.lines = {};

    // array with x axis values
    self.xAxis = [];

    // object with global listeners that must be unset sometimes
    self.globalListeners = {};

    // it's not handy to use columns data as it presented in source,
    // so we distill values of x axis, keys of lines and very lines to separated properties
    // and there is no any scheme-checks because we believe that data object will always have the same structure
    for (var i = 0; i < self.data.columns.length; i++) {
      var key = self.data.columns[i][0];
      switch (self.data.types[key]) {
        case 'x':
          self.xAxis = self.data.columns[i].slice(1);
          break;
        case 'line':
          var values = self.data.columns[i].slice(1);
          self.lines[key] = {
            values: values,
            maxValue: Architect.getMax(values),
            color: self.data.colors[key],
            name: self.data.names[key],
          };
          break;
        default:
        // nothing here for now
      }
    }

    self.visibleLines = Object.keys(self.lines);
    self.linesLength = self.lines[self.visibleLines[0]].values.length;

    // just counter of visible lines; when it > 0, popup is visible too
    self.isPopupEnabled = Object.keys(self.lines).length;

    // calc max y axis length
    var maxLinesValues = Object.keys(self.lines).map(function(key) { return Architect.getMax(self.lines[key].maxValue); });
    self.maxYAxisLength = Architect.getMax(maxLinesValues);
    self.gridValueToPixelsRatio = self.maxYAxisLength / GRID_HEIGHT;

    // body contains grid and chart
    self.nodes.body = Architect.getHTMLNode('div', 'body');
    self.nodes.body.style.height = BODY_HEIGHT + 'px';

    // chart contains colored lines
    self.nodes.chart = Architect.getSVGNode('svg', 'chart');
    self.nodes.chart.setAttribute('height', GRID_HEIGHT);
    self.nodes.body.appendChild(self.nodes.chart);

    // grid contains vertical and horizontal lines and labels for them
    self.nodes.grid = Architect.getSVGNode('svg', 'grid');
    self.nodes.grid.setAttribute('height', BODY_HEIGHT);
    self.nodes.body.appendChild(self.nodes.grid);

    // dots are live above the chart in a different svg
    self.nodes.dotsHolder = Architect.getSVGNode('svg', 'dots');
    self.nodes.dotsHolder.setAttribute('height', GRID_HEIGHT + ROOT_PADDING * 2);

    // create groups that we will scale when we should scale the chart by x axis
    // just to prevent scaling each path and to separate x scaling from y scaling,
    // because we need to animate only y scaling
    self.nodes.chartYScalingGroup = Architect.getSVGNode('g', 'y-group');
    self.nodes.chartXScalingGroup = Architect.getSVGNode('g', 'x-group');
    self.nodes.chartXScalingGroup.appendChild(self.nodes.chartYScalingGroup);
    self.nodes.chart.appendChild(self.nodes.chartXScalingGroup);

    // range contains range window and range chart
    self.nodes.range = Architect.getHTMLNode('div', 'range');
    self.nodes.rangeWindow = Architect.getHTMLNode('div', 'range-window');

    // for some reason Safari can't apply correct cursor prop value to before/after
    // so we create divs above the borders for it
    var rangeWindowLeftBorder = Architect.getHTMLNode('div', 'range-window-border');
    var rangeWindowRightBorder = Architect.getHTMLNode('div', 'range-window-border');
    self.nodes.rangeWindow.appendChild(rangeWindowLeftBorder);
    self.nodes.rangeWindow.appendChild(rangeWindowRightBorder);

    self.nodes.rangeChart = Architect.getSVGNode('svg');
    self.nodes.rangeChart.setAttribute('height', RANGE_HEIGHT);

    // create same scaling group, but for the range chart
    self.nodes.rangeScalingGroup = Architect.getSVGNode('g', 'range-group');

    self.nodes.rangeChart.appendChild(self.nodes.rangeScalingGroup);
    self.nodes.range.appendChild(self.nodes.rangeChart);
    self.nodes.range.appendChild(self.nodes.rangeWindow);

    // legend contains checkboxes
    // we don't need to save link to it
    var legendNode = Architect.getHTMLNode('div', 'legend');

    Object.keys(self.lines).forEach(function(key) {
      var label = Architect.getHTMLNode('label', 'label');
      var labelText = Architect.getHTMLNode('span', 'label-text');
      var checkbox = Architect.getHTMLNode('input', 'checkbox', { type: 'checkbox', checked: true });
      var fakeCheckbox = Architect.getHTMLNode('span', 'fake-checkbox');

      checkbox.dataset.id = key;
      labelText.innerHTML = self.data.names[key];

      label.style.color = self.lines[key].color;

      Architect.listen(checkbox, 'change', function() {
        self.toggleLine(this.dataset.id, this.checked); // TODO: it's strange but it forces repaint on all checkboxes/labels
      });

      label.appendChild(checkbox);
      label.appendChild(fakeCheckbox);
      label.appendChild(labelText);

      legendNode.appendChild(label);
    });

    self.bounds = {
      window: {},
      root: {},
      chart: {
        unscaledLeft: 0,
        xScale: 1,
        yScale: 1,
        prevYScale: 1
      },
      range: {
        yScale: 1
      },
      rangeWindow: {}
    };

    // batch write to the DOM
    self.nodes.root.appendChild(self.nodes.body);
    self.nodes.root.appendChild(self.nodes.range);
    self.nodes.root.appendChild(self.nodes.dotsHolder);
    self.nodes.root.appendChild(legendNode);

    // and then batch read from it
    self.bounds.root.width = self.nodes.root.clientWidth - ROOT_PADDING * 2;
    self.bounds.root.left = self.nodes.root.getBoundingClientRect().left + ROOT_PADDING;
    self.bounds.rangeWindow.minWidth = RANGE_CHART_HEIGHT / CHART_HEIGHT * self.bounds.root.width;
    self.bounds.rangeWindow.width = self.bounds.rangeWindow.minWidth;
    self.bounds.window.width = window.innerWidth;

    cb();
  };

  /**
   * Draw lines of chart
   */
  Chartman.prototype.drawChart = function() {
    var self = this;

    // firstly we calc range to chart ratio, to use it later
    self.rangeToChartRatio = RANGE_CHART_HEIGHT / CHART_HEIGHT;

    // calc total width of the chart
    self.bounds.chart.totalWidth = self.bounds.root.width / self.rangeToChartRatio;

    // set width of the chart on svg node
    self.nodes.chart.setAttribute('width', self.bounds.chart.totalWidth);

    // instead of translating each path we just shift whole viewBox
    self.nodes.chart.setAttribute('viewBox',
      [
        -STROKE_COMPENSATION,
        -CHART_HEIGHT - STROKE_COMPENSATION,
        self.bounds.chart.totalWidth + STROKE_COMPENSATION * 2,
        GRID_HEIGHT
      ].join(' ')
    );

    // calc sizes of cells of the chart
    self.chartCellWidth = self.bounds.chart.totalWidth / (self.xAxis.length - 1); // -1 because we need to use number of cells, not 'lines'
    self.chartCellHeight = CHART_HEIGHT / self.maxYAxisLength; // there's no -1, because maxYAxisLength is 0-based, when xAxis.length is 1-based

    // TODO: should it be reversed like in the demo or not?
    // generate paths
    // we add minus sign to 'y' coordinate of each point
    // because we need to invert the chart, and move 0,0 to left bottom corner from left top
    for (var key in self.lines) {
      self.paths.chart[key] = Architect.getSVGNode('path', 'path', {
        stroke: self.lines[key].color,
        d: Architect.getD(self.lines[key], self.chartCellWidth, self.chartCellHeight),
      });

      self.nodes.chartYScalingGroup.appendChild(self.paths.chart[key]);
    }
  };

  /**
   * Make init rescale and change opacity of root node
   */
  Chartman.prototype.show = function() {
    var self = this;

    var maxLeft = self.bounds.root.width - self.bounds.rangeWindow.width;

    self.bounds.chart.unscaledLeft = maxLeft / self.rangeToChartRatio;

    Architect.DOMSetStyle(self.nodes.rangeWindow, 'transform', 'translateX(' + maxLeft + 'px)');
    Architect.DOMSetStyle(
      [self.nodes.chart, self.nodes.gridHorizontalLabels],
      'transform',
      'translateX(-' + self.bounds.chart.unscaledLeft * self.bounds.chart.xScale + 'px)'
    );

    self.rescaleChart(self.bounds.chart.xScale, self.getYScale());
    self.bounds.rangeWindow.left = maxLeft + self.bounds.root.left;

    Architect.DOMSetStyle([self.nodes.root, self.paths.chart], 'opacity', 1);
  };

  /**
   * Rescale chart by X and Y axis
   * @param {number} xScale - Scale by X axis
   * @param {number} yScale - Scale by Y axis
   * @param {boolean} force - Force rescale without checking
   */
  Chartman.prototype.rescaleChart = function(xScale, yScale, force) {
    // TODO: `force` param here is stupid
    // TODO: when we use xscale we lost some pixels in the end of the chart
    // TODO: i think we need to calc xscale substracting stroke compensation from the width
    var self = this;
    xScale = xScale || 1;
    yScale = yScale || 1;

    if (xScale !== self.bounds.chart.xScale) {
      if (IS_OLD_BROWSER) {
        self.fallbackRescaleChart(xScale, self.bounds.chart.yScale);
      } else {
        Architect.DOMSetStyle(self.nodes.chartXScalingGroup, 'transform', 'scale(' + xScale + ', 1)');
      }
      self.bounds.chart.totalWidth = self.bounds.root.width / self.rangeToChartRatio * xScale;
      self.bounds.chart.xScale = xScale;
    }

    if (yScale !== self.bounds.chart.yScale || force) {
      self.bounds.chart.prevYScale = self.bounds.chart.yScale;
      self.bounds.chart.yScale = yScale;

      if (IS_OLD_BROWSER) {
        self.fallbackRescaleChart(self.bounds.chart.xScale, yScale);
      } else {
        Architect.DOMSetStyle(self.nodes.chartYScalingGroup, 'transform', 'scale(1,' + yScale + ')');
      }

      if (!self.timers.gridLinesUpdate) {
        if (force) {
          self.timers.gridLinesUpdate = true;
          updateGrid();
        } else {
          self.timers.gridLinesUpdate = setTimeout(updateGrid, GRID_UPDATE_DELAY);
        }
      }
    }

    /**
     * Redraw grid
     */
    function updateGrid() {
      var scaleDiff = self.bounds.chart.prevYScale / self.bounds.chart.yScale;
      var currentRatio = self.gridValueToPixelsRatio / self.bounds.chart.yScale;

      var topYLabel = Architect.getYLabel(Math.floor((GRID_HEIGHT - self.horizontalLines[self.horizontalLines.length - 1].pathPosition) * currentRatio));

      // prevent useless update when top y label is the same after formatting
      // TODO: maybe we should to compare whole array?
      if (topYLabel === self.currentTopYLabel) {
        self.timers.gridLinesUpdate = null;
        return;
      } else {
        self.currentTopYLabel = topYLabel;
      }

      // according to https://jsperf.com/innerhtml-vs-replacechild/7 nodeValue is the best option in FF, Chrome, Safari & IE
      self.paths.gridLabelsNext[self.horizontalLines.length - 1].firstChild.nodeValue = topYLabel;

      // TODO: here we assume that y axis is only 0-based, but it maybe wrong assumption!
      for (var i = 1; i < self.horizontalLines.length - 1; i++) {
        self.paths.gridLabelsNext[i].firstChild.nodeValue = Architect.getYLabel(Math.floor((GRID_HEIGHT - self.horizontalLines[i].pathPosition) * currentRatio));
      }

      // TODO: actually in demo there is not scaling, there is something like moving each line
      self.nodes.gridLinesNextGroup.style.transitionDuration = '0s'; // remove to prevent transition
      self.nodes.gridLinesNextGroup.style.transform = 'scale(1,' + scaleDiff + ')';

      // revert duration on the next loop cycle!
      setTimeout(function() {
        self.nodes.gridLinesNextGroup.style.transitionDuration = '.25s'; // restore
        self.nodes.gridLinesNextGroup.style.transform = 'scale(1, 1)';
        self.nodes.gridLinesNextGroup.style.opacity = 1;

        self.nodes.gridLinesUsedGroup.style.transform = 'scale(1, ' + (1 / scaleDiff) + ')';
        self.nodes.gridLinesUsedGroup.style.opacity = 0;

        var tmp = self.nodes.gridLinesUsedGroup;
        self.nodes.gridLinesUsedGroup = self.nodes.gridLinesNextGroup;
        self.nodes.gridLinesNextGroup = tmp;

        tmp = self.paths.gridLabelsUsed;
        self.paths.gridLabelsUsed = self.paths.gridLabelsNext;
        self.paths.gridLabelsNext = tmp;

        self.timers.gridLinesUpdate = null;
      });
    }
  };

  /**
   * Fallback for `rescaleChart` which completely redraw chart. Used for old browsers that don't support `vector-effect`
   * @param {number} xScale - Scale by X axis
   * @param {number} yScale - Scale bby Y axis
   */
  Chartman.prototype.fallbackRescaleChart = function(xScale, yScale) {
    var self = this;

    var widthCost = self.chartCellWidth * xScale;
    var heightCost = self.chartCellHeight * yScale;

    for (var key in self.lines) {
      self.paths.chart[key].setAttribute('d', Architect.getD(self.lines[key], widthCost, heightCost));
    }
  };

  /**
   * Rescale range chart depends on visible lines and current yScale
   */
  Chartman.prototype.autoRescaleRange = function() {
    var self = this;

    if (!self.visibleLines.length) return;

    var maxValues = [];
    for (var i = 0; i < self.visibleLines.length; i++) {
      maxValues.push(Architect.getMax(self.lines[self.visibleLines[i]].maxValue));
    }

    var yScale = self.maxYAxisLength / Architect.getMax(maxValues);

    if (yScale !== self.bounds.range.yScale) {
      self.bounds.range.yScale = yScale;

      if (IS_OLD_BROWSER) {
        self.fallbackRescaleRange(yScale);
      } else {
        Architect.DOMSetStyle(self.nodes.rangeScalingGroup, 'transform', 'scale(1,' + yScale + ')');
      }
    }
  };

  /**
   * Fallback for `autoRescaleRange` which completely redraw range chart.
   * Used for old browsers that don't support `vector-effect`
   * @param {number} yScale - Scale by Y axis
   */
  Chartman.prototype.fallbackRescaleRange = function(yScale) {
    var self = this;

    var heightCost = self.rangeCellHeight * yScale;

    for (var key in self.lines) {
      self.paths.range[key].setAttribute('d', Architect.getD(self.lines[key], self.rangeCellWidth, heightCost));
    }
  };

  /**
   * Calc scale by Y axis
   * @returns {number} - Scale by Y axis
   */
  Chartman.prototype.getYScale = function() {
    // TODO: we can predict next yscale depends on how many pixels used has passed during last movement (`moving speed`)
    //       and use it for more smooth animation
    var self = this;

    if (!self.visibleLines.length) {
      return self.bounds.chart.yScale;
    }

    var start = self.bounds.chart.unscaledLeft / self.chartCellWidth;
    var end = start + self.bounds.root.width / self.bounds.chart.xScale / self.chartCellWidth;

    var roundedStart = Math.ceil(start);
    var roundedEnd = Math.floor(end);
    var sliceEnd = roundedEnd + 1;

    var maxY = self.lines[self.visibleLines[0]].values[roundedStart];
    for (var i = 0; i < self.visibleLines.length; i++) {
      for (var j = roundedStart; j < sliceEnd; j++) {
        if (self.lines[self.visibleLines[i]].values[j] > maxY) {
          maxY = self.lines[self.visibleLines[i]].values[j];
        }
      }
    }

    var prevStart = roundedStart - 1;
    if (roundedStart > 0 && roundedStart !== start) {
      for (var i = 0; i < self.visibleLines.length; i++) {
        var y = getY(prevStart, roundedStart, self.lines[self.visibleLines[i]].values[prevStart], self.lines[self.visibleLines[i]].values[roundedStart], start);
        if (y > maxY) {
          maxY = y;
        }
      }
    }

    var nextEnd = roundedEnd + 1;
    if (sliceEnd < self.linesLength && roundedEnd !== end) {
      for (var i = 0; i < self.visibleLines.length; i++) {
        var y = getY(nextEnd, roundedEnd, self.lines[self.visibleLines[i]].values[nextEnd], self.lines[self.visibleLines[i]].values[roundedEnd], end);
        if (y > maxY) {
          maxY = y;
        }
      }
    }

    /**
     * Get `y` coordinate of a point on line, by coordinates of the line and `x` of the point
     * @param {number} x1 - X coordinate of line's start
     * @param {number} x2 - X coordinate of line's end
     * @param {number} y1 - Y coordinate of line's start
     * @param {number} y2 - Y coordinate of line's end
     * @param {number} x - X coordinate of the point
     * @returns {number} - Y coordinate of the point
     */
    function getY(x1, x2, y1, y2, x) {
      return y1 + ((x - x1) * (y2 - y1) / (x2 - x1));
    }

    return self.maxYAxisLength / maxY;
  };

  /**
   * Draw range chart
   */
  Chartman.prototype.drawRange = function() {
    var self = this;

    self.rangeCellWidth = self.chartCellWidth * self.rangeToChartRatio;
    self.rangeCellHeight = self.chartCellHeight * self.rangeToChartRatio;

    // set width of the chart on svg node
    self.nodes.rangeChart.setAttribute('width', self.bounds.root.width);

    // instead of translating each path we just shift whole viewBox
    self.nodes.rangeChart.setAttribute(
      'viewBox',
      [
        -RANGE_STROKE_COMPENSATION,
        -RANGE_CHART_HEIGHT - RANGE_STROKE_COMPENSATION,
        self.bounds.root.width + RANGE_STROKE_COMPENSATION * 2,
        RANGE_HEIGHT
      ].join(' ')
    );

    // generate paths
    // we add minus sign to 'y' coordinate of each point
    // because we need to invert the chart, and move 0,0 to left bottom corner from left top
    for (var key in self.lines) {
      self.paths.range[key] = Architect.getSVGNode('path', 'range-path', {
        d: Architect.getD(self.lines[key], self.rangeCellWidth, self.rangeCellHeight),
        stroke: self.lines[key].color,
      });

      self.nodes.rangeScalingGroup.appendChild(self.paths.range[key]);
    }

    // save and set range window width and left offset
    self.bounds.rangeWindow.left = self.nodes.rangeWindow.getBoundingClientRect().left;

    Architect.DOMSetStyle(self.nodes.rangeWindow, 'width', self.bounds.rangeWindow.width + 'px');
  };

  /**
   * Draw grid, y lines, x/y labels, x line and dots
   */
  Chartman.prototype.drawGrid = function() {
    var self = this;

    var testTextNode = Architect.getSVGNode('text');
    Architect.appendText(testTextNode, 'Text');
    testTextNode.style.visibility = 'hidden';

    self.nodes.grid.appendChild(testTextNode);

    self.nodes.grid.setAttribute('width', self.bounds.root.width);

    self.nodes.grid.setAttribute(
      'viewBox',
      [
        0,
        0,
        self.bounds.root.width,
        BODY_HEIGHT
      ].join(' ')
    );

    self.labelHeight = testTextNode.getBBox().height; // dont remove testTextNode here, because we overuse it later

    // TODO: there is some obscure thing here; for some reason there are some free space above top label
    // we leave enough space on the grid for drawing a label
    var offset = (GRID_HEIGHT - self.labelHeight - Y_LABELS_OFFSET) / (HORIZONTAL_LINES_NUMBER - 1); // - 1 because we are starting with 0
    var position = GRID_HEIGHT;
    self.horizontalLines = [];

    for (var i = 0; i < HORIZONTAL_LINES_NUMBER; i++) {
      self.horizontalLines.push({
        pathPosition: position,
        textPosition: position - Y_LABELS_OFFSET
      });
      position -= offset;
    }

    self.nodes.gridLinesUsedGroup = Architect.getSVGNode('g', 'grid-y-lines-group');
    self.nodes.gridLinesNextGroup = Architect.getSVGNode('g', 'grid-y-lines-group');

    self.nodes.gridLinesUsedGroup.style.opacity = 1;
    self.nodes.gridLinesUsedGroup.style.transform = 'scale(1,1)';

    self.paths.gridLabelsUsed = [];
    self.paths.gridLabelsNext = [];

    var d = 'M0,0V-' + LINE_THICKNESS + 'H' + self.bounds.root.width + 'V0';

    var currentRatio = self.gridValueToPixelsRatio / self.getYScale();

    for (var i = 0; i < self.horizontalLines.length; i++) {
      var linePath = Architect.getSVGNode('path', 'grid-y-line', {
        d: d,
        transform: 'translate(0, ' + self.horizontalLines[i].pathPosition + ')'
      });
      var textPath = Architect.getSVGNode('text', 'grid-y-label', {
        transform: 'translate(0, ' + self.horizontalLines[i].textPosition + ')'
      });

      // TODO: optimize it!
      self.currentTopYLabel = Architect.getYLabel(Math.floor((GRID_HEIGHT - self.horizontalLines[i].pathPosition) * currentRatio));

      Architect.appendText(textPath, self.currentTopYLabel);

      self.nodes.gridLinesUsedGroup.appendChild(linePath);
      self.paths.gridLabelsUsed.push(self.nodes.gridLinesUsedGroup.appendChild(textPath));
      self.nodes.gridLinesNextGroup.appendChild(linePath.cloneNode());
      self.paths.gridLabelsNext.push(self.nodes.gridLinesNextGroup.appendChild(textPath.cloneNode(true)));
    }

    self.nodes.grid.appendChild(self.nodes.gridLinesUsedGroup);
    self.nodes.grid.appendChild(self.nodes.gridLinesNextGroup);

    self.nodes.verticalLinePath = Architect.getSVGNode('path', 'grid-x-line', {
      d: 'M0,0H' + LINE_THICKNESS + 'V' + GRID_HEIGHT + 'H0'
    });

    self.nodes.grid.appendChild(self.nodes.verticalLinePath);
    self.nodes.dotsHolder.setAttribute('width', self.bounds.root.width + ROOT_PADDING * 2);
    self.nodes.dotsHolder.setAttribute('viewBox', [
      0,
      -CHART_HEIGHT - STROKE_COMPENSATION - ROOT_PADDING * 2,
      self.bounds.root.width + ROOT_PADDING * 2,
      GRID_HEIGHT + ROOT_PADDING * 2
    ].join(' '));

    self.nodes.dots = {};

    for (var key in self.lines) {
      var dot = Architect.getSVGNode('circle', 'dot', {
        r: 3
      });

      dot.style.color = self.lines[key].color;
      self.nodes.dots[key] = dot;

      self.nodes.dotsHolder.appendChild(dot);
    }

    self.nodes.gridHorizontalLabels = Architect.getSVGNode('g');

    testTextNode = Architect.getSVGNode('text', 'grid-x-label');
    Architect.appendText(testTextNode, 'May 30');
    testTextNode.style.visibility = 'hidden';

    self.horizontalLabels = [];

    self.nodes.grid.appendChild(testTextNode);

    self.labelWidth = testTextNode.getBBox().width;

    testTextNode.parentNode.removeChild(testTextNode);

    var labelsPosition = BODY_HEIGHT - self.labelHeight / 3; // / 3 because we need to shift labels

    var pixelsPerItem = self.bounds.chart.totalWidth / (self.xAxis.length - 1); // - 1 here because we calc spaces between items

    var possibleLabelsNumber = self.xAxis.length - 2; // don't include start and end labels
    var labelStepRaw = Math.floor(self.labelWidth / pixelsPerItem);
    var labelsStep = labelStepRaw ? labelStepRaw * 2 : 1; // prevent possibility of getting 0 here
    var verticalLabelsNumber = Math.floor(possibleLabelsNumber / labelsStep);
    self.xAxisLabelWidth = pixelsPerItem * labelsStep;

    // 3 because we need space for item and around it
    // it will be used when we will count skipFactor
    self.xAxisSkipOffsetRatio = 3 - self.xAxisLabelWidth / self.labelWidth;
    self.xAxisSkipOffsetRatio = self.xAxisSkipOffsetRatio > 0 ? self.xAxisSkipOffsetRatio : 1;

    self.xAxisSkipStart = self.labelWidth / 2;
    self.xAxisSkipEnd = self.bounds.chart.totalWidth - self.labelWidth / 2;

    var i = 1; // start from the first element because zero one is placed exactly on 0,0
    var xOffset = self.xAxisLabelWidth;

    while (i < (verticalLabelsNumber + 1)) {
      var label = Architect.getSVGNode('text', 'grid-x-label', {
        'text-anchor': 'middle',
        x: 0,
        y: labelsPosition,
      });

      // for some reason Safari understands only transform attr here
      label.setAttribute('transform', 'translate(' + xOffset + ',1)');
      Architect.appendText(label, Architect.getXLabel(self.xAxis[i * labelsStep]));
      xOffset += self.xAxisLabelWidth;
      self.nodes.gridHorizontalLabels.appendChild(label);
      self.horizontalLabels.push(label);
      i += 1;
    }

    self.nodes.grid.appendChild(self.nodes.gridHorizontalLabels);
  };

  /**
   * Draw popup
   */
  Chartman.prototype.drawPopup = function() {
    var self = this;

    self.nodes.popup = Architect.getHTMLNode('div', 'popup');
    self.nodes.popupTitle = Architect.getHTMLNode('div', 'popup-title');
    self.nodes.popupBody = Architect.getHTMLNode('div', 'popup-body');

    Architect.appendText(self.nodes.popupTitle, '0')
    self.nodes.popup.appendChild(self.nodes.popupTitle);
    self.nodes.popup.appendChild(self.nodes.popupBody);

    self.nodes.popupBodyData = {};

    for (var key in self.lines) {
      var data = Architect.getHTMLNode('div', 'popup-data');
      var number = Architect.getHTMLNode('div', 'popup-number');
      var label = Architect.getHTMLNode('div', 'popup-label');

      data.style.color = self.lines[key].color;

      Architect.appendText(number, '0');
      Architect.appendText(label, self.lines[key].name);
      data.appendChild(number);
      data.appendChild(label);

      self.nodes.popupBody.appendChild(data);
      self.nodes.popupBodyData[key] = {
        data: data,
        number: number,
      };
    }

    self.nodes.body.appendChild(self.nodes.popup);
  };

  /**
   * Initialize global listeners
   */
  Chartman.prototype.initListeners = function() {
    var self = this;

    self.globalListeners = {
      onResize: self.onResizeRoot.bind(self),
      onRangeMouseDown: self.onRangeMouseDown.bind(self),
      onRangeWindowMouseDown: self.onRangeWindowMouseDown.bind(self),
      onBodyMouseEnter: self.onBodyMouseEnter.bind(self),
      onBodyMouseMove: self.onBodyMouseMove.bind(self),
      onBodyMouseLeave: self.onBodyMouseLeave.bind(self)
    };

    Architect.listen(window, 'resize', self.globalListeners.onResize);

    Architect.listen(self.nodes.range, ['mousedown', 'touchstart'], self.globalListeners.onRangeMouseDown);

    // TODO: disable user-select on body when moving range?
    Architect.listen(self.nodes.rangeWindow, ['mousedown', 'touchstart'], self.globalListeners.onRangeWindowMouseDown);

    Architect.listen(self.nodes.dotsHolder, ['mouseenter', 'touchstart'], self.globalListeners.onBodyMouseEnter);
    Architect.listen(self.nodes.dotsHolder, 'touchstart', self.globalListeners.onBodyMouseMove); // to show dots on mobile on the first touch

    Architect.listen(self.nodes.dotsHolder, ['mousemove', 'touchmove'], self.globalListeners.onBodyMouseMove);
    Architect.listen(self.nodes.dotsHolder, ['mouseleave', 'touchend'], self.globalListeners.onBodyMouseLeave);
  };

  /**
   * Remove global listeners
   */
  Chartman.prototype.removeListeners = function() {
    var self = this;

    Architect.unlisten(window, 'resize', self.globalListeners.onResize);

    Architect.unlisten(self.nodes.range, ['mousedown', 'touchstart'], self.globalListeners.onRangeMouseDown);

    Architect.unlisten(self.nodes.rangeWindow, ['mousedown', 'touchstart'], self.globalListeners.onRangeWindowMouseDown);

    Architect.unlisten(self.nodes.dotsHolder, ['mouseenter', 'touchstart'], self.globalListeners.onBodyMouseEnter);
    Architect.unlisten(self.nodes.dotsHolder, 'touchstart', self.globalListeners.onBodyMouseMove);

    Architect.unlisten(self.nodes.dotsHolder, ['mousemove', 'touchmove'], self.globalListeners.onBodyMouseMove);
    Architect.unlisten(self.nodes.dotsHolder, ['mouseleave', 'touchend'], self.globalListeners.onBodyMouseLeave);
  };

  /**
   * Handle mousedown on range which moves range window and the chart
   * @param {Event} e - Event
   */
  Chartman.prototype.onRangeMouseDown = function(e) {
    var self = this;
    var clientX = Architect.getClientX(e);

    if (clientX < self.bounds.rangeWindow.left || clientX > self.bounds.rangeWindow.left + self.bounds.rangeWindow.width) {
      var leftShift = clientX - self.bounds.root.left;
      var maxLeft = self.bounds.root.width - self.bounds.rangeWindow.width;
      var newLeft = leftShift > 0 ? leftShift - self.bounds.rangeWindow.width / 2 : leftShift + self.bounds.rangeWindow.width / 2;

      if (newLeft < 0) {
        newLeft = 0;
      } else if (newLeft > maxLeft) {
        newLeft = maxLeft;
      }

      self.bounds.chart.unscaledLeft = newLeft / self.rangeToChartRatio;

      Architect.DOMSetStyle(self.nodes.rangeWindow, 'transform', 'translateX(' + newLeft + 'px)');
      Architect.DOMSetStyle(
        [self.nodes.chart, self.nodes.gridHorizontalLabels],
        'transform',
        'translateX(-' + self.bounds.chart.unscaledLeft * self.bounds.chart.xScale + 'px)'
      );

      self.rescaleChart(self.bounds.chart.xScale, self.getYScale());

      self.bounds.rangeWindow.left = newLeft + self.bounds.root.left;
    }
  };

  /**
   * Handle mousedown on range window which moves and resizes range window and the chart
   * @param {Event} e - Event
   */
  Chartman.prototype.onRangeWindowMouseDown = function(e) {
    var self = this;
    var clickLeftShift = Architect.getClientX(e) - self.bounds.rangeWindow.left;

    // TODO: fix stroke-width compensation when resizing (look at the right side)
    if (clickLeftShift <= RANGE_WINDOW_BORDER_WIDTH || (e.touches && clickLeftShift <= MOBILE_RANGE_WINDOW_BORDER_WIDTH)) {
      self.onRangeWindowResize.call(this, e, 'left');
    } else if (clickLeftShift >= self.bounds.rangeWindow.width - RANGE_WINDOW_BORDER_WIDTH || (e.touches && clickLeftShift >= self.bounds.rangeWindow.width - MOBILE_RANGE_WINDOW_BORDER_WIDTH)) {
      self.onRangeWindowResize.call(this, e, 'right');
    } else {
      self.onRangeWindowDrag.call(this, e);
    }
  };

  /**
   * Handle range window resize (synthetic handler, there's no such event on DOM; it's used in `onRangeWindowMouseDown`)
   * @param {Event} e - Event
   * @param {string} direction - Direction of resizing (`left` or `right`)
   */
  Chartman.prototype.onRangeWindowResize = function(e, direction) {
    var self = this;

    e.preventDefault();
    e.stopPropagation();

    var startX = Architect.getClientX(e);

    var startLeft = self.bounds.rangeWindow.left - self.bounds.root.left;
    var minLeft = startLeft + (self.bounds.rangeWindow.width - self.bounds.rangeWindow.minWidth);
    var startWidth = self.bounds.rangeWindow.width;
    var maxWidth = self.bounds.root.width - startLeft;

    var currentLeft = startLeft;

    addStylesChanges();

    if (direction === 'left') {
      Architect.listen(document, ['mousemove', 'touchmove'], onMouseLeftMove);
      Architect.listen(document, ['mouseup', 'touchend'], removeOnMouseLeftMove);
    } else {
      Architect.listen(document, ['mousemove', 'touchmove'], onMouseRightMove);
      Architect.listen(document, ['mouseup', 'touchend'], removeOnMouseRightMove);
    }

    /**
     * Handle mouse and touch moving to the left
     * @param {Event} e - Event
     */
    function onMouseLeftMove(e) {
      var newLeft = Architect.getClientX(e) - startX + startLeft;

      if (newLeft < 0) {
        newLeft = 0;
      } else if (newLeft > minLeft) {
        newLeft = minLeft;
      }

      var newWidth = self.bounds.rangeWindow.width + currentLeft - newLeft;

      currentLeft = newLeft;
      self.bounds.rangeWindow.width = newWidth;

      recalcChartScale(newWidth, newLeft);

      Architect.DOMSetStyle(self.nodes.rangeWindow, {
        transform: 'translateX(' + newLeft + 'px)',
        width: newWidth + 'px'
      });
    }

    /**
     * Remove handlers of left moving and recalc chart
     */
    function removeOnMouseLeftMove() {
      self.bounds.rangeWindow.left = currentLeft + self.bounds.root.left;

      removeStylesChanges();

      self.rescaleChart(self.bounds.chart.xScale, self.bounds.chart.yScale, true);
      self.rescaleXAxis(self.bounds.chart.xScale);

      Architect.unlisten(document, ['mousemove', 'touchmove'], onMouseLeftMove);
      Architect.unlisten(document, ['mouseup', 'touchend'], removeOnMouseLeftMove);
    }

    /**
     * Handle mouse and touch moving to the right
     * @param {Event} e - Event
     */
    function onMouseRightMove(e) {
      var newWidth = Architect.getClientX(e) - startX + startWidth;

      if (newWidth > maxWidth) {
        newWidth = maxWidth;
      } else if (newWidth < self.bounds.rangeWindow.minWidth) {
        newWidth = self.bounds.rangeWindow.minWidth;
      }

      self.bounds.rangeWindow.width = newWidth;

      recalcChartScale(newWidth, currentLeft);

      Architect.DOMSetStyle(self.nodes.rangeWindow, 'width', newWidth + 'px');
    }

    /**
     * Remove handlers of right moving and recalc chart
     */
    function removeOnMouseRightMove() {
      removeStylesChanges();

      self.rescaleChart(self.bounds.chart.xScale, self.bounds.chart.yScale, true);
      self.rescaleXAxis(self.bounds.chart.xScale);

      Architect.unlisten(document, ['mousemove', 'touchmove'], onMouseRightMove);
      Architect.unlisten(document, ['mouseup', 'touchend'], removeOnMouseRightMove);
    }

    /**
     * Recalc chart scale depends on new width and left of range window
     * @param {number} width - Width of range window
     * @param {number} left - Left of range window
     */
    function recalcChartScale(width, left) {
      // recalc x scale ratio
      var currentXScale = self.bounds.rangeWindow.minWidth / width;

      // change translate by x axis always, because it doesn't matter how we resize the window
      self.bounds.chart.unscaledLeft = left / self.rangeToChartRatio;

      Architect.DOMSetStyle(
        [self.nodes.chart, self.nodes.gridHorizontalLabels],
        'transform',
        'translateX(-' + self.bounds.chart.unscaledLeft * currentXScale + 'px)'
      );

      // rescale each path
      self.rescaleChart(currentXScale, self.getYScale());
      self.rescaleXAxis(currentXScale);
    }

    var resizeClassName = ROOT_CLASSNAME + '_mode_resize';

    /**
     * Add resizing class
     */
    function addStylesChanges() {
      // prevent changing cursor when hovering on other places of range window
      self.nodes.root.classList.add(resizeClassName);
    }

    /**
     * Remove resizing class
     */
    function removeStylesChanges() {
      self.nodes.root.classList.remove(resizeClassName);
    }
  };

  /**
   * Handle range window drag (synthetic handler, there's no such event on DOM; it's used in `onRangeWindowMouseDown`)
   * @param {Event} e - Event
   */
  Chartman.prototype.onRangeWindowDrag = function(e) {
    var self = this;

    e.preventDefault();
    e.stopPropagation();

    var dragClassName = ROOT_CLASSNAME + '_mode_drag';

    // prevent changing cursor when hovering on other places of range window
    self.nodes.root.classList.add(dragClassName); // TODO: ie? here and everywhere

    var startLeft = self.bounds.rangeWindow.left - self.bounds.root.left;
    var maxLeft = self.bounds.root.width - self.bounds.rangeWindow.width;
    var oldLeft = startLeft - Architect.getClientX(e);

    var currentLeft = startLeft;

    Architect.listen(document, ['mousemove', 'touchmove'], onMouseMove);
    Architect.listen(document, ['mouseup', 'touchend'], removeOnMouseMove);

    /**
     * Handle mouse moving which causes range window dragging
     * @param {Event} e - Event
     */
    function onMouseMove(e) {
      var newLeft = Architect.getClientX(e) + oldLeft;

      if (newLeft < 0) {
        newLeft = 0;
      } else if (newLeft > maxLeft) {
        newLeft = maxLeft;
      }

      self.bounds.chart.unscaledLeft = newLeft / self.rangeToChartRatio;

      currentLeft = newLeft;

      Architect.DOMSetStyle(self.nodes.rangeWindow, 'transform', 'translateX(' + newLeft + 'px)');
      Architect.DOMSetStyle(
        [self.nodes.chart, self.nodes.gridHorizontalLabels],
        'transform',
        'translateX(-' + self.bounds.chart.unscaledLeft * self.bounds.chart.xScale + 'px)'
      );

      self.rescaleChart(self.bounds.chart.xScale, self.getYScale());
    }

    /**
     * Remove handlers of  mouse moving and recalc range window data
     */
    function removeOnMouseMove() {
      self.bounds.rangeWindow.left = currentLeft + self.bounds.root.left;

      self.nodes.root.classList.remove(dragClassName);

      Architect.unlisten(document, ['mousemove', 'touchmove'], onMouseMove);
      Architect.unlisten(document, ['mouseup', 'touchend'], removeOnMouseMove);
    }
  };

  /**
   * Handle mouse moving over body which causes popup, dots and vertical line showing
   * @param {Event} e - Event
   */
  Chartman.prototype.onBodyMouseMove = function(e) {
    var self = this;

    if (!self.bodyIsHovered) return;

    var currentLeft = Architect.getClientX(e) - self.bounds.root.left;

    if (currentLeft < 0 || currentLeft > self.bounds.root.width) return;

    var currentElementIndex = (self.bounds.chart.unscaledLeft + currentLeft / self.bounds.chart.xScale) / self.chartCellWidth;
    var roundedElementIndex = Math.round(currentElementIndex);

    // TODO: for some reason in the end of the chart we have an incorrect position!
    // TODO: what if we just scale it as chart?
    var roundedVerticalLinePosition = ((roundedElementIndex * self.chartCellWidth * self.bounds.chart.xScale) - self.bounds.chart.unscaledLeft * self.bounds.chart.xScale);

    if (Math.abs(roundedVerticalLinePosition - currentLeft) < VERTICAL_LINE_ACCURACY) {
      if (roundedVerticalLinePosition < 0) {
        roundedVerticalLinePosition = 0;
      } else if ((self.bounds.root.width - roundedVerticalLinePosition) < 1) {
        roundedVerticalLinePosition -= 1
      }

      // right now user's mouse may already leave the body, so let's not write anything
      if (!self.bodyIsHovered) return;

      self.nodes.popupTitle.firstChild.nodeValue = Architect.getXLabel(self.xAxis[roundedElementIndex], true);

      for (var i = 0; i < self.visibleLines.length; i++) {
        self.nodes.popupBodyData[self.visibleLines[i]].number.firstChild.nodeValue = Architect.getPopupNumber(self.lines[self.visibleLines[i]].values[roundedElementIndex]);
      }

      if (!self.bodyIsHovered) return;

      var currentPopupWidth = self.nodes.popup.getBoundingClientRect().width;

      // TODO: it's possible to animate these transformations manually, to make translating of grid line and dots smooth

      for (var i = 0; i < self.visibleLines.length; i++) {
        self.nodes.dots[self.visibleLines[i]].style.opacity = 1;
        self.nodes.dots[self.visibleLines[i]].style.transform = 'translate(' + (roundedVerticalLinePosition + ROOT_PADDING) + 'px,-' + (self.chartCellHeight * self.lines[self.visibleLines[i]].values[roundedElementIndex] * self.bounds.chart.yScale + ROOT_PADDING) + 'px)';
      }

      Architect.DOMSetStyle(
        self.nodes.verticalLinePath,
        {
          opacity: 1,
          transform: 'translateX(' + roundedVerticalLinePosition + 'px)'
        }
      );

      var popupPosition = roundedVerticalLinePosition;
      var widthDiff = self.bounds.root.width - (popupPosition + POPUP_OFFSET + currentPopupWidth);
      var popupTransform = '';

      // TODO: actually there is better to make the popup for flexible
      //       because there is a possibility of much more amount of data
      if (widthDiff < 0) {
        if (POPUP_OFFSET + currentPopupWidth > popupPosition) {
          popupTransform = 'translateX(' + (popupPosition + widthDiff + POPUP_OFFSET / 2) + 'px)';
        } else {
          popupTransform = 'translateX(' + (popupPosition - POPUP_OFFSET) + 'px) translateX(-100%)';
        }
      } else {
        popupTransform = 'translateX(' + (popupPosition + POPUP_OFFSET) + 'px)';
      }

      Architect.DOMSetStyle(
        self.nodes.popup,
        {
          opacity: 1,
          transform: popupTransform
        }
      );
    }
  };

  /**
   * Handle mouse entering on body area which enables popup handlers
   */
  Chartman.prototype.onBodyMouseEnter = function() {
    var self = this;

    if (!self.isPopupEnabled) return;

    self.bodyIsHovered = true;
  };

  /**
   * Handle mouse leaving on body area which disables popup handlers
   */
  Chartman.prototype.onBodyMouseLeave = function() {
    var self = this;
    self.bodyIsHovered = false;
    Architect.DOMSetStyle(
      [
        self.nodes.verticalLinePath,
        self.nodes.popup,
        self.nodes.dots,
      ],
      'opacity',
      0
    );
  };

  /**
   * Handle root node resizing and redraw whole chart
   */
  Chartman.prototype.onResizeRoot = function() {
    var self = this;

    if (window.innerWidth === self.bounds.window.width) return;

    var newWidth = self.nodes.root.clientWidth;

    self.nodes.root.style.transform = 'scale(' + (newWidth / self.bounds.root.width) + ', 1)';
    self.nodes.root.style.opacity = '.5';

    clearTimeout(self.timers.onResize);
    self.timers.onResize = setTimeout(function() {
      while (self.nodes.root.hasChildNodes()) {
        self.nodes.root.removeChild(self.nodes.root.lastChild);
      }

      self.nodes.root.style.transform = '';
      self.nodes.root.style.opacity = '0';

      self.removeListeners();

      self.init(self.nodes.root, self.data, function() {
        self.drawChart();
        self.drawRange();
        self.drawGrid();
        self.drawPopup();
        self.initListeners();

        setTimeout(function() {
          self.show(); // TODO: should be run after all calculations!
        });
      });
    }, 500);
  };

  /**
   * Recalc X axis labels positions depends on current scale
   * @param {number} scale - Scale
   */
  Chartman.prototype.rescaleXAxis = function(scale) {
    var self = this;
    scale = scale || 1;

    // count lowest power of 2 for `1 / scale`
    var skipFactor = Math.pow(2, Math.floor(Math.log(1 / scale * self.xAxisSkipOffsetRatio) / Math.log(2)));

    var opacity = 1;
    var offset = self.xAxisLabelWidth * scale;
    var xOffset = offset;

    for (var i = 0; i < self.horizontalLabels.length; i++) {
      opacity = skipFactor ? (i % skipFactor > 0 ? 0 : 1) : 1;
      opacity = (xOffset < self.xAxisSkipStart || xOffset > self.xAxisSkipEnd) ? 0 : opacity;

      self.horizontalLabels[i].setAttribute('transform', 'translate(' + xOffset + ',1)');
      self.horizontalLabels[i].style.opacity = opacity;

      xOffset += offset;
    }
  };

  /**
   * Hide or show line
   * @param {string} id - Line ID
   * @param {boolean} isVisible - Visibility flag
   */
  Chartman.prototype.toggleLine = function(id, isVisible) {
    var self = this;

    if (isVisible) {
      self.visibleLines = self.visibleLines.concat(id);
      self.isPopupEnabled++;
    } else {
      self.visibleLines = self.visibleLines.filter(function(l) { return l !== id });
      self.isPopupEnabled--;
    }

    if (isVisible) {
      self.paths.chart[id].style.opacity = 1;
      self.paths.range[id].style.opacity = 1;
      self.nodes.popupBodyData[id].data.style.display = 'inline-block';
    } else {
      self.paths.chart[id].style.opacity = 0;
      self.paths.range[id].style.opacity = 0;
      self.nodes.popupBodyData[id].data.style.display = 'none';
    }

    self.rescaleChart(self.bounds.chart.xScale, self.getYScale(), true);
    self.autoRescaleRange();
  };

  /**
   * Submodule that contains all important stateless calculations
   * @type {object}
   */
  var Architect = {
    /**
     * Build a label for Y axis
     * @param {number} value - Number that must be formatted
     * @returns {string} - Short version of the `value` with postfix `K`, `M`, `B` or without it
     */
    getYLabel: function(value) {
      if (value >= 1e9) return +((value / 1e9).toFixed(1)) + 'B';
      if (value >= 1e6) return +((value / 1e6).toFixed(1)) + 'M';
      if (value >= 1e3) return +((value / 1e3).toFixed(1)) + 'K';
      return '' + value;
    },

    /**
     * Format number according to en-US format, for usage inside popup (because it's better to show long numbers here)
     * @param {number} n - Number
     * @returns {string} - Formatted number
     */
    getPopupNumber: function(n) {
      return new Intl.NumberFormat('en-US').format(n); // use en-US because the interface uses english
    },

    /**
     * Build a label for X axis
     * @param {number} value - Timestamp that must be converted to readable date
     * @param {boolean?} isWeekdayShown  - Flag that enables adding a weekday to the result
     * @returns {string} - Readable date
     */
    getXLabel: function (value, isWeekdayShown) {
      // TODO: actually it may be better to show year in labels when amount of data is huge, but idk if it's requested by contest
      return new Date(value).toLocaleDateString('en-US', { weekday: isWeekdayShown ? 'short' : undefined, day: 'numeric', month: 'short' });
    },

    /**
     * Find max value in passed array of numbers
     * @param {...number[]} array - Array of numbers
     * @returns {number} - Max value
     */
    getMax: function(array) {
      return Math.max.apply(null, [].concat.apply([], arguments));
    },

    /**
     * Create instance of SVGElement with passed tag name and attributes
     * @param {string} tagName - Name of tag that will be created
     * @param {string?} elementClassName - Element part of className of BEM node that will be created
     * @param {object?} attributes - Object with attributes that will be set to created element
     * @returns {SVGElement} - Instance of SVGElement
     */
    getSVGNode: function(tagName, elementClassName, attributes) {
      var element = document.createElementNS('http://www.w3.org/2000/svg', tagName);

      if (elementClassName) {
        element.setAttribute('class', ROOT_CLASSNAME + '__' + elementClassName);
      }

      if (attributes) {
        for (var key in attributes) {
          element.setAttribute(key, attributes[key]);
        }
      }

      return element;
    },

    /**
     * Create instance of HTMLElement with passed tag name and attributes
     * @param {string} tagName - Name of tag that will be created
     * @param {string} elementClassName - Element part of className of BEM node that will be created
     * @param {object?} attributes - Object with attributes that will be set to created element
     * @returns {HTMLElement} - Instance of HTMLElement
     */
    getHTMLNode: function(tagName, elementClassName, attributes) {
      var element = document.createElement(tagName);

      if (elementClassName) {
        element.setAttribute('class', ROOT_CLASSNAME + '__' + elementClassName);
      }

      if (attributes) {
        for (var key in attributes) {
          element.setAttribute(key, attributes[key]);
        }
      }

      return element;
    },

    /**
     * Appends text node to passed parent node
     * @param {HTMLElement | SVGElement} parent - Parent node
     * @param {string} text - Text
     * @returns {Text} - Created text node
     */
    appendText: function(parent, text) {
      return parent.appendChild(document.createTextNode(text));
    },

    /**
     * Internal Architect's method that is used for applying styles to DOM
     * @param {Node} node - HTML or SVG node
     * @param {string|object} prop - Name of CSS prop or object `name: value`
     * @param {string?} value - Value of the prop if the previous argument is string
     * @private
     */
    _DOMSetStyle: function(node, prop, value) {
      if (typeof prop === 'object') {
        Object.keys(prop).forEach(function(p) {
          node.style[p] = prop[p];
        });
      } else {
        node.style[prop] = value;
      }
    },

    /**
     * Apply styles to DOM nodes
     * @param {Node|Node[]|object} node - Node, array of them or an object `name: node`
     * @param {string|object} prop - Name of CSS prop or object `name: value`
     * @param {string?} value - Value of the prop if the previous argument is string
     */
    DOMSetStyle: function(node, prop, value) {
      var self = this;

      if (Array.isArray(node)) {
        node.forEach(function(n) {
          if (!(n instanceof Node)) {
            self.DOMSetStyle(n, prop, value);
          } else {
            self._DOMSetStyle(n, prop, value);
          }
        });
      } else if (node instanceof Node) {
        self._DOMSetStyle(node, prop, value);
      } else {
        Object.keys(node).forEach(function(key) {
          self._DOMSetStyle(node[key], prop, value);
        });
      }
    },

    /**
     * Calc `d` attribute value for `path` SVG element based on line data and cost of width/height
     * @param {object} line - Object with line data which contains `.values` prop with array of points values
     * @param {number} widthCost - X value multiplier
     * @param {number} heightCost - Y value multiplier
     * @returns {string} - Value of `d` attribute
     */
    getD: function(line, widthCost, heightCost) {
      var d = 'M0,-' + (heightCost * line.values[0]);

      for (var i = 1; i < line.values.length; i++) {
        d += 'L' + (widthCost * i) + ',-' + (heightCost * line.values[i]);
      }

      return d;
    },

    /**
     * Extract `clientX` prop from event data
     * @param {MouseEvent|TouchEvent} e - Event
     * @returns {number} - `clientX` value
     */
    getClientX: function(e) {
      return e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
    },

    /**
     * Add listener to passed node for passed event(s)
     * @param {Node} node - Node
     * @param {string|string[]} event - Event name or array of them
     * @param {function} cb - Handler
     */
    listen: function(node, event, cb) {
      if (Array.isArray(event)) {
        event.forEach(function(e) { node.addEventListener(e, cb); });
      } else {
        node.addEventListener(event, cb);
      }
    },

    /**
     * Remove listener to passed node for passed event(s)
     * @param {Node} node - Node
     * @param {string|string[]} event - Event name or array of them
     * @param {function} cb - Handler
     */
    unlisten: function(node, event, cb) {
      if (Array.isArray(event)) {
        event.forEach(function(e) { node.removeEventListener(e, cb); });
      } else {
        node.removeEventListener(event, cb);
      }
    }
  };

  // Export to `window` (usually)
  this.Chartman = Chartman;
}).call(this);
