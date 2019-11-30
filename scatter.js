function makeplot() {
  Plotly.d3.csv("final/player_scores.csv", function(data){ processData(data) } );
};


function processData(allRows) {
  var x = [], y = [], player = [];
  for (var i=0; i<allRows.length; i++) {
    row = allRows[i];
    x.push(row['losses']);
    y.push(row['wins']);
    player.push(row['player']);
  }
  makePlotly(x, y, player);
};


function makePlotly(x, y, player) {
  var traces = [{
    x: x,
    y: y,
    text: player,
    mode: 'markers',
    type: 'scatter',
    hovertemplate: '%{text}<br>' +
	           '%{y} wins, %{x} losses' +
	           '<extra></extra>'
  }];

	
  var layout = {
    title: 'Player Wins vs Losses',
    xaxis: {
      title: 'Losses',
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      title: 'Wins',
      showline: false,
      zeroline: false
    },
    width: 620,
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
  }

  // Make the plot
  Plotly.newPlot('player_scores', traces, layout, config);

  // Add Hover info to plot
  //var myPlot = document.getElementById('player_scores');
  //var hoverInfo = document.getElementById('hoverinfo');
  //myPlot.on('plotly_hover', function(data) {
  //  var infotext = data.points.map(function(d) {
  //    return (d.data.name+': x= '+d.x+', y= '+d.y.toPrecision(3));
  //  });
  //    hoverInfo.innerHTML = infotext.join('<br/>');
  //  })
  // .on('plotly_unhover', function(data){
  //    hoverInfo.innerHTML = '';
  //});


};

makeplot();
