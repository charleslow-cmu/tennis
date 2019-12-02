function makeSurfacePlot() {
  Plotly.d3.csv("final/surfaces.csv", function(data) { processSurfaceData(data); });
}

function processSurfaceData(data) {

  var lookup = {};
  function getData(surface) {
    var trace;
    if (!(trace = lookup[surface])) {
      trace = lookup[surface] = {
        x: [],
        y: []
      };
    }
    return trace;
  }

  // Go through each row, get the right trace, and append the data:
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];
    var trace = getData(datum.surface);
    trace.x.push(parseInt(datum.year));
    trace.y.push(parseInt(datum.money));
  }
  var surfaces = Object.keys(lookup);
  var colors = ["#ca6a45", "#d2410a", "#7a9755", "#567b96"];

  // Create traces
  var traces = [];
  for (i = 0; i < surfaces.length; i++) {
    var surface_data = lookup[surfaces[i]];
    traces.push({
      x: surface_data.x.slice(),
      y: surface_data.y.slice(),
      name: surfaces[i],
      mode: 'none',
      fill: 'tonexty',
      type: 'scatter',
      stackgroup: 'one',
      fillcolor: colors[i]
    });
  }
  
  makeSurfacePlotly(traces);
};


function makeSurfacePlotly(traces) {

  var layout = {
    title: 'Most Popular Tournament Surfaces by Total Prize Money',
    xaxis: {
      title: 'Year',
      zeroline: false
    },
    yaxis: {
      title: 'Total Prize Money (2019 USD)',
      showline: false,
      zeroline: false
    },
    width: 800,
    height: 450,
    margin: {
      l: 60,
      r: 0,
      b: 60,
      t: 80,
      pad: 0
    }
  };

  var config = {
    displayModeBar: false
  };

  // Make the plot
  Plotly.newPlot('tournament_surface', {
    data: traces,
    layout: layout,
    config: config
  });

};

makeSurfacePlot();
