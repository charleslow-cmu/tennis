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
  console.log(players);
  
  var lookup = {};
  function getData(year) {
    var trace;
    if (!(trace = lookup[year])) {
      trace = lookup[year] = {
        x: [],
        y: [],
	ratio: [],
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
    trace.text.push(datum.player);
    trace.x.push(parseInt(datum.losses));
    trace.y.push(parseInt(datum.wins));
    trace.ratio.push(parseInt(datum.wins) + 1 / parseInt(datum.losses) + 1);
    trace.ids.push(players[datum.player]);
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
  console.log(traces);

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
  console.log(frames);

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
      range: [-4, 34],
      zeroline: false
    },
    yaxis: {
      title: 'Wins',
      range: [-4, 74],
      showline: false,
      zeroline: false
    },
    width: 720,
    height: 600,
    margin: {
      l: 60,
      r: 0,
      b: 60,
      t: 80,
      pad: 0
    },
    hovermode: 'closest',
    sliders: [{
      pad: {l: 50, t: 55},
      currentvalue: {
        visible: true,
        prefix: 'Year:',
        xanchor: 'right',
        font: {size: 20, color: '#666'}
      },
      steps: sliderSteps
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
