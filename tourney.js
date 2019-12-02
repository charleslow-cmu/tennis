function getBaseLog(x, base) {
  return Math.log(x) / Math.log(base);
}

Plotly.d3.csv("final/tournaments.csv", function(data) { 
  
  // Go through each row and get unique tourneys
  var tourneys = {};
  var j = 0;
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];
    if (!(tourneys[datum.tourney])) {
      tourneys[datum.tourney] = j;
      j++;
    }
  }
  
  var lookup = {};
  function getData(year, surface) {
    var byYear, trace;
    if (!(byYear = lookup[year])) {;
      byYear = lookup[year] = {};
    }
    if (!(trace = byYear[surface])) {
      trace = byYear[surface] = {
	type: 'scattergeo',
        lat: [],
        lon: [],
	name: surface,
        ids: [],
        text: [],
	mode: 'markers',
        marker: {size: []}
      };
    }
    return trace;
  }

  // Go through each row, get the right trace, and append the data:
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];
    var trace = getData(datum.year, datum.surface);
    var tourneyId = tourneys[datum.tourney];
    var moneyMillion = Math.round(datum.money / 500000) / 2;
    trace.lat.push(parseInt(datum.lat));
    trace.lon.push(parseInt(datum.lng));
    trace.marker.size.push(parseInt(datum.money));
    trace.ids.push(tourneyId);
    trace.text.push(datum.tourney + " $" + moneyMillion.toString() + "M");
  }

  // Get the group names:
  var years = Object.keys(lookup);
  var firstYear = lookup[years[0]];
  var surfaces = Object.keys(firstYear).sort();
  console.log(surfaces);
  var colors = ["#9d00f2", "#d2410a", "#7a9755", "#567b96"];

  // Create the main trace
  var traces = [];
  for (i = 0; i < surfaces.length; i++) {
    var surface_data = firstYear[surfaces[i]]; 
    traces.push({
      type: 'scattergeo',
      lat: surface_data.lat.slice(),
      lon: surface_data.lon.slice(),
      ids: surface_data.ids.slice(),
      text: surface_data.text.slice(),
      name: surfaces[i],
      mode: 'markers',
      marker: {
	      size: surface_data.marker.size.slice(), 
	      color: colors[i],
	      opacity: 0.5,
	      sizemode: 'area',
	      sizeref: 10000
      },
      hovertemplate: '%{text}' +
          '<extra></extra>'
    });
  }
  console.log(traces);

  // Create a frame for each year  
  var frames = [];
  for (i = 0; i < years.length; i++) {
    frames.push({
      name: years[i],
      data: surfaces.map(function (surface) {
        return getData(years[i], surface);
      })
    });
  }
  
  makeTourneyPlotly(years, traces, frames);
});


function makeTourneyPlotly(years, traces, frames) {
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
        frame: {duration: 500, redraw: true}
      }]
    });
  }

  var layout = {
    title: 'Tournaments by Prize Money',
    autosize: true,
    showlegend: true,
    geo: {
	projection: {
	  type: 'robinson'
	},
        scope: 'world',
        resolution: 150,
        lonaxis: {
          'range': [-120, 160]
        },
        lataxis: {
          'range': [-45, 70]
        },
        showrivers: true,
        rivercolor: '#fff',
        showlakes: true,
        lakecolor: '#fff',
        showland: true,
        landcolor: '#E5E5E5',
        countrycolor: '#E5E5E5',
        countrywidth: 1.5,
        subunitcolor: '#E5E5E5'
    },
    width: 900,
    height: 550,
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 40,
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
      pad: {t: 37, r: 10},
      buttons: [{
        method: 'animate',
        args: [null, {
          mode: 'immediate',
          fromcurrent: true,
          transition: {duration: 0, easing: 'linear'},
          frame: {duration: 500, redraw: true}
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
      pad: {l: 120, t: 10},
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
  Plotly.newPlot('tournament', {
    data: traces,
    layout: layout,
    frames: frames,
    config: config
  });

};

