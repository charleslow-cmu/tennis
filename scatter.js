function makeplot() {
  Plotly.d3.csv("final/player_scores_by_year.csv", function(data){ processData(data) } );
};

function processData(data) {

  // Go through each row and get unique players
  var players = {};
  var j = 0;
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];
    if (!(players[datum.player])) {
      players[datum.player] = j;
      j++;
    }
  }
  
  var lookup = {};
  function getData(year) {
    var trace;
    if (!(trace = lookup[year])) {
      trace = lookup[year] = {
        x: [],
        y: [],
	ids: [],
        text: []
      };
    }
    return trace;
  }

  // Go through each row, get the right trace, and append the data:
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];
    var trace = getData(datum.year);
    var playerId = players[datum.player];
    trace.text.push(datum.player);
    trace.x.push(parseInt(datum.losses));
    trace.y.push(parseInt(datum.wins));
    trace.ids.push(playerId);
  }

  // Get the group names:
  var years = Object.keys(lookup);
  var firstYear = lookup[2019];

  // Create the main trace
  var traces = [];
  traces.push({
    x: firstYear.x.slice(),
    y: firstYear.y.slice(),
    ids: firstYear.ids.slice(),
    text: firstYear.text.slice(),
    mode: 'markers',
    marker: {size: 12, opacity: 0.7},
    type: 'scatter',
    hovertemplate: '%{text}<br>' +
	           '%{y} wins, %{x} losses' +
	           '<extra></extra>'
  });

  // Create a frame for each year  
  var frames = [];
  for (i = 0; i < years.length; i++) {
    frames.push({
      name: years[i],
      data: [getData(years[i])]
    });
  }
  
  makePlotly(years, traces, frames);
};


function makePlotly(years, traces, frames) {

  // Now create slider steps, one for each frame  
  var sliderSteps = [];
  for (i = 0; i < years.length; i++) {
    sliderSteps.push({
      method: 'animate',
      label: years[i],
      args: [[years[i]], {
        mode: 'immediate',
        transition: {duration: 500, easing: 'linear'},
        frame: {duration: 500, redraw: false}
      }]
    });
  }

  var layout = {
    title: 'Player Wins vs Losses',
    xaxis: {
      title: 'Losses',
      range: [-4, 44],
      zeroline: false
    },
    yaxis: {
      title: 'Wins',
      range: [-4, 128],
      showline: false,
      zeroline: false
    },
    width: 800,
    height: 600,
    margin: {
      l: 60,
      r: 0,
      b: 60,
      t: 80,
      pad: 0
    },
    hovermode: 'closest',
    updatemenus: [{
      x: 0,
      y: 0,
      yanchor: 'top',
      xanchor: 'left',
      showactive: false,
      direction: 'left',
      type: 'buttons',
      pad: {t: 87, r: 10},
      buttons: [{
        method: 'animate',
        args: [null, {
          mode: 'immediate',
          fromcurrent: true,
          transition: {duration: 1000, easing: 'linear'},
          frame: {duration: 1000, redraw: false}
        }],
        label: 'Play'
      }, {
        method: 'animate',
        args: [[null], {
          mode: 'immediate',
          transition: {duration: 0},
          frame: {duration: 0, redraw: false}
        }],
        label: 'Pause'
      }]
    }],
    sliders: [{
      pad: {l: 120, t: 55},
      currentvalue: {
        visible: true,
        prefix: 'Year:',
        xanchor: 'right',
        font: {size: 20, color: '#666'}
      },
      steps: sliderSteps,
      active: years.length - 1
    }]
  };

  var config = {
    displayModeBar: false
  }

  // Make the plot
  Plotly.newPlot('player_scores', {
    data: traces,
    layout: layout,
    frames: frames,
    config: config
  });

};

makeplot();
