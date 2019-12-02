Plotly.d3.csv("final/elo1990s.csv", function(data) { 

  var lookup = {};
  function getData(player) {
    var trace;
    if (!(trace = lookup[player])) {
      trace = lookup[player] = {
        x: [],
        y: [],
	text: [],
	surface: []
      };
    }
    return trace;
  }

  // Go through each row, get the right trace, and append the data:
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];
    var trace = getData(datum.player);
    trace.x.push(parseInt(datum.year) + "-" + parseInt(datum.month) + "-" + parseInt(datum.day));
    trace.y.push(parseFloat(datum.elo));
    trace.text.push(parseInt(datum.year) + " " + datum.tourney + "<br>" + datum.surface);
  }

  var players = Object.keys(lookup);

  // Create traces
  var colors = ['#1b9e77', '#d95f02', '#7570b3', '#e7298a'];
  var traces = [];
  for (i = 0; i < players.length; i++) {
    var data = lookup[players[i]];
    traces.push({
      x: data.x.slice(),
      y: data.y.slice(),
      text: data.text.slice(),
      name: players[i],
      mode: 'lines',
      type: 'scatter',
      opacity: 0.7,
      line: {color: colors[i]},
      hovertemplate: '%{text}' +
	             '<extra></extra>'
    });
  }

  var layout = {
    title: 'ELO History of Top Players (1990s)',
    xaxis: {
      title: 'Date',
      zeroline: false
    },
    yaxis: {
      title: 'ELO Score',
      showline: false,
      zeroline: false
    },
    width: 800,
    height: 500,
    margin: {
      l: 60,
      r: 0,
      b: 60,
      t: 80,
      pad: 0
    },
    hovermode: 'closest'
  };

  var config = {
    displayModeBar: false
  };

  // Make the plot
  Plotly.newPlot('elo1', {
    data: traces,
    layout: layout,
    config: config
  });
  
});

