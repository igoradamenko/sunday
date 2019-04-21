var ROOT_NODE = document.getElementById('chart');

var WIDTH = 600;
var HEIGHT = 300;

var TYPE_X = 'x';

var MAX_SCALE = 5;

var xScale = 1;
var yScale = 1;
var xShift = 0;

var linePaths = {};

function drawChart(root, data) {
  var maxX = data.columns[0].length - 1;
  var maxY = 0;

  for (var i = 0; i < data.columns.length; i++) {
    if (data.types[data.columns[i][0]] === TYPE_X) continue;

    for (var j = 2; j < data.columns[i].length; j++) {
      if (maxY < data.columns[i][j]) maxY = data.columns[i][j];
    }
  }

  // −1 because we count spaces between dots
  var xCost = WIDTH / (maxX - 1);
  var yCost = HEIGHT / (maxY - 1);

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', WIDTH);
  svg.setAttribute('height', HEIGHT);
  svg.setAttribute('viewBox', '0 -' + HEIGHT + ' ' + WIDTH + ' ' + HEIGHT);

  for (var i = 0; i < data.columns.length; i++) {
    if (data.types[data.columns[i][0]] === TYPE_X) continue;

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var d = 'M0,-' + (data.columns[i][1] * yCost);

    // first element is the name of the column,
    // second element we already processed above;
    // so we start from the third one
    for (var j = 2; j < data.columns[i].length; j++) {
      d += 'L' + ((j - 1) * xCost) + ',-' + (data.columns[i][j] * yCost);
    }

    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', data.colors[data.columns[i][0]]);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('vector-effect', 'non-scaling-stroke');

    linePaths[data.columns[i][0]] = path;

    svg.appendChild(path);
  }

  root.appendChild(svg);
}

function drawControls(root, data) {
  var inputsDiv = document.createElement('div');

  inputsDiv.appendChild(document.createTextNode('X scale: '));

  var xInput = document.createElement('input');
  xInput.setAttribute('type', 'range');
  xInput.setAttribute('min', '0');
  xInput.setAttribute('max', '100');
  xInput.setAttribute('value', '0');
  inputsDiv.appendChild(xInput);

  xInput.addEventListener('input', function() {
    xScale = 1 + (+this.value / 100 * (MAX_SCALE - 1));
    rescaleChart();
  });

  inputsDiv.appendChild(document.createElement('br'));

  inputsDiv.appendChild(document.createTextNode('Y scale: '));

  var yInput = document.createElement('input');
  yInput.setAttribute('type', 'range');
  yInput.setAttribute('min', '0');
  yInput.setAttribute('max', '100');
  yInput.setAttribute('value', '0');
  inputsDiv.appendChild(yInput);

  yInput.addEventListener('input', function() {
    yScale = 1 + (+this.value / 100 * (MAX_SCALE - 1));
    rescaleChart();
  });

  inputsDiv.appendChild(document.createElement('br'));

  inputsDiv.appendChild(document.createTextNode('Scroll: '));

  var scrollInput = document.createElement('input');
  scrollInput.setAttribute('type', 'range');
  scrollInput.setAttribute('min', '0');
  scrollInput.setAttribute('max', '100');
  scrollInput.setAttribute('value', '0');
  inputsDiv.appendChild(scrollInput);

  scrollInput.addEventListener('input', function() {
    xShift = +this.value / 100 * WIDTH;
    rescaleChart();
  });

  inputsDiv.appendChild(document.createElement('br'));

  inputsDiv.appendChild(document.createTextNode('Lines: '));

  for (var i = 0; i < data.columns.length; i++) {
    if (data.types[data.columns[i][0]] === TYPE_X) continue;

    var checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('data-id', data.columns[i][0]);
    checkbox.setAttribute('checked', '');

    checkbox.addEventListener('change', function() {
      toggleChart(this.getAttribute('data-id'), this.checked);
    });

    inputsDiv.appendChild(checkbox);
    inputsDiv.appendChild(document.createTextNode(data.names[data.columns[i][0]]));
  }

  root.appendChild(inputsDiv);
}

function toggleChart(id, state) {
  linePaths[id].style.opacity = state ? 1 : 0;
}

function rescaleChart() {
  Object.keys(linePaths).forEach(function(key) {
    linePaths[key].setAttribute('transform', 'translate(-' + (xShift * (xScale - 1)) +  ') scale(' + xScale + ', ' + yScale + ')');
  });
}

window.TGC = function(DATA) {
  drawChart(ROOT_NODE, DATA);
  drawControls(ROOT_NODE, DATA);
};
