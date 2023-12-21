// GLOBAL VARIABLES
var DATA = {};
var FILTERS = {};
var DATA_EXTENT = {'rank': [200, 0], 'reps_avg':[1, 70], 'weight_avg_lbs':[3, 160], 'height_avg_in': [6, 60]};
var COLOR_SCALE = {};
var UPDATE = {};
const YEARS = ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'];
var SELECTED_YEAR = '2020';
var SELECTED_BREED = 'poodle';

const clearAllFilters = () => {
   Object.keys(DATA[SELECTED_BREED]).forEach(k => {
      if (!(k.includes('rank_') || k == 'image')) FILTERS[k] = null;
   });
   if ('clear_train' in UPDATE) UPDATE.clear_train();
   if ('clear_protect' in UPDATE) UPDATE.clear_protect();
   if ('rank_bar' in UPDATE) UPDATE.rank_bar();
   if ('rank_line' in UPDATE) UPDATE.rank_line();
   if ('home_spider' in UPDATE) UPDATE.home_spider();
   if ('care_spider' in UPDATE) UPDATE.care_spider();
   if ('image' in UPDATE) UPDATE.image();
   if ('train_mat' in UPDATE) UPDATE.train_mat();
   if ('protect_mat' in UPDATE) UPDATE.protect_mat();
   if ('appearance_scatter' in UPDATE) UPDATE.appearance_scatter();
   d3.selectAll('.trainSquare')
   .transition()
   .duration(1000)
   .attr('stroke', 'black');
   d3.selectAll('.legendAppearanceShape')
   .transition()
   .duration(1000)
   .attr('fill', 'black');
   d3.selectAll('.protectSquare')
   .transition()
   .duration(1000)
   .attr('stroke', 'black');
   d3.selectAll('.swatch')
   .transition()
   .duration(1000)
   .attr('stroke-width', '1px')
   .attr('stroke', 'black');
   d3.selectAll('.axisHandle')
   .transition()
   .duration(1000)
   .attr('fill', 'white');
}

// LOAD DATA
d3.csv('dogs.csv', d3.autoType).then(data => {
   d3.select('#button_clear').on('click', clearAllFilters);
   data.forEach(d => {
      DATA[d.breed] = d;
   })
   DATA_FILTERED = DATA;
   clearAllFilters()
   plotRankBar();
   plotRankLine();
   plotImageData();
   plotCareData();
   plotHomeData();
   plotTrainData();
   plotProtectData();
   plotPhysicalTraitsData();
});

const getFilteredData = () => {
   /** Returns only those data points to which 
       all set filters are applied using AND logic. 
   */
   let data = [];
   let filter_conditions_met;
   Object.values(DATA).forEach(d => {
      filter_conditions_met = true;
      Object.keys(FILTERS).forEach((f) => {
         filter_conditions_met = filter_conditions_met && (FILTERS[f] == null || d[f] == FILTERS[f]);
      });
      if (filter_conditions_met) data.push(d);
   });
   return data;
}

// PLOT RANKING DATA
const plotRankBar = () => {
   var breeds = getFilteredData().map(d => d.breed);
   // Add plot.
   const marginSvg = {top: 15, right: 60, bottom: 160, left: 30};
   var widthSvg = breeds.length*20;
   const widthDiv = 295 - marginSvg.left - marginSvg.right;
   const heightSvg = 240 - marginSvg.bottom - marginSvg.top;

   // Plot x axis data (breeds).
   const divXAxis = d3.select('#plot_rank_bar')
                      .append('div')
                      .style('overflow-x', 'scroll')
                      .style("max-width", `${widthDiv+marginSvg.left}px`);
   const svgXAxis = divXAxis.append('svg');
   svgXAxis.attr("width", widthSvg + marginSvg.left)
         .attr("height", heightSvg + marginSvg.top + marginSvg.bottom)
   const gXAxis = svgXAxis.append('g')
                        .attr("transform", `translate(${marginSvg.left},${marginSvg.top})`);
   const xScale = d3.scaleBand()
                  .domain(breeds)
                  .range([0, widthSvg])
                  .padding(0.1);
   const xAxisBreeds = gXAxis.call(d3.axisBottom(xScale))
                           .attr("transform", `translate(${marginSvg.left}, ${marginSvg.top+heightSvg})`);
   xAxisBreeds.selectAll('path').remove();
   xAxisBreeds.selectAll("text")
            .style('font-size', '9px')
            .style('font-style', 'italic')
            .style('word-spacing', '1.5px')
            .style('letter-spacing', '1px')
            .style("text-anchor", "end")
            .attr("transform", `rotate(-70) translate(${-10}, ${-10})`);

   // Plot y axis data (rankings).
   const divYAxis = d3.select('#plot_rank_bar')
                      .append('div');
   const svgYAxis = divYAxis.append('svg')
                     .attr("width", marginSvg.right)
                     .attr("height", heightSvg + marginSvg.top + marginSvg.bottom)
   const gYAxis = svgYAxis.append('g')
                        .attr("transform", `translate(${0},${marginSvg.top})`);
   const yScale = d3.scaleLinear()
                  .domain(DATA_EXTENT.rank)
                  .range([heightSvg, 0]);
   const yAxisRanks = gYAxis.call(d3.axisRight(yScale).ticks(3));

   // Add labels.
   const labelsXAxis = svgXAxis.append('g');
   const labelsYAxis = svgYAxis.append('g');
   labelsYAxis.append('text')
            .style('font-style', 'italic')
            .style('word-spacing', '2px')
            .style('letter-spacing', '1.5px')
            .style('font-size', '10px')
            .attr("transform", `translate(${5},${marginSvg.top+heightSvg+marginSvg.bottom-80})`)
            .text('►Breed');
   labelsYAxis.append('text')
            .attr("transform", `rotate(90) translate(${marginSvg.top+(heightSvg/2)-10},${-marginSvg.right+12})`)
            .text('◄ Rank');

   // Add bars.
   const gBars = svgXAxis.append('g').lower();
   let selectedBreedBarXPos = 0;
   const draw = () => {
      // Get data.
      var data = getFilteredData().map(d => {
         return {
            'breed': d.breed,
            'rank': d[`rank_${SELECTED_YEAR}`]
         }
      }); // filter
      data = data.slice().sort((a, b) => d3.ascending(a.rank, b.rank)); // sort
      let breeds = data.map(d => d.breed);
      widthSvg = (breeds.length*20 < widthDiv) ? widthDiv-40 : breeds.length*20;
      svgXAxis.transition()
            .duration(1000)
            .attr("width", widthSvg + marginSvg.left);
      xScale.range([0, widthSvg])
            .domain(breeds);
      xAxisBreeds.transition()
               .duration(1000)
               .call(d3.axisBottom(xScale))
               .selectAll('.tick')
               .style('color', d => d == SELECTED_BREED ? 'blue' : 'gray');
      xAxisBreeds.selectAll('.tick')
               .on('mouseover', function (event, d) {
                  d3.select(this)
                     .style('font-style', 'italic')
                     .style('color', 'blue');
                  d3.select('#heading_rank')
                  .html(`Breed = ${d.toLocaleUpperCase()}`);
               })
               .on('mouseout', function (event) {
                  let breed = event.target.innerHTML
                  if (SELECTED_BREED != breed) {
                     d3.select(this)
                     .style('font-style', 'normal')
                     .style('color', 'gray');
                     d3.select('#heading_rank')
                     .html('Popularity Ranking');
                  }
               })
               .on('click', function (event) {
                  xAxisBreeds.selectAll('.tick')
                           .style('font-style', 'normal')
                           .style('color', 'gray');
                  d3.select(this)
                  .style('font-style', 'italic')
                  .style('color', 'blue');
                  let breed = event.target.innerHTML;
                  SELECTED_BREED = breed;
                  UPDATE.rank_bar();
                  UPDATE.rank_line();
                  UPDATE.care_spider();
                  UPDATE.home_spider();
                  UPDATE.image();
                  UPDATE.train_mat();
                  UPDATE.protect_mat();
                  UPDATE.appearance_scatter();
               });

      xAxisBreeds.selectAll('.tick')
               .style('font-style', d => d === SELECTED_BREED ? 'italic' : 'normal')
               .style('color', d => d === SELECTED_BREED ? 'blue' : 'gray');
      xAxisBreeds.selectAll("text")
               .style("text-anchor", "end")
               .attr("transform", `rotate(-70) translate(${-10}, ${-10})`);

      gBars.selectAll('.rank_bar')
         .data(data)
         .join('rect')
         .attr('class', 'rank_bar')
         .attr('x', d => xScale(d.breed) + marginSvg.left)
         .attr('y', d => marginSvg.top+yScale(d.rank))
         .attr("width", xScale.bandwidth())
         .transition()
         .duration(1000)
         .attr("height", d => heightSvg-yScale(d.rank))
         .attr("fill", d => {
            let fillColor = '#ccc';
            if(d.breed == SELECTED_BREED) {
               fillColor = 'blue';
               selectedBreedBarXPos = xScale(d.breed) - 100;
               if (selectedBreedBarXPos < 0) selectedBreedBarXPos = 0;
            }
            return fillColor;
         });

      // Auto scroll to currently selected breed.
      divXAxis._groups[0][0].scroll(selectedBreedBarXPos, 0);

      // Add labels.
      labelsXAxis.selectAll('.rank_label')
               .transition()
               .duration(100)
               .attr('opacity', 0)
               .remove();
                 
      labelsXAxis.selectAll('.rank_label')
               .data(data)
               .join('text')
               .attr('class', 'rank_label')
               .text(d => d.rank)
               .style("font-size", "10px")
               .attr("transform", d => `translate(${xScale(d.breed)+marginSvg.left},${yScale(d.rank)+marginSvg.top-2})`)
               .transition()
               .duration(1000)
               .attr('opacity', 1);
      if ('home_spider' in UPDATE) UPDATE.home_spider();
      if ('care_spider' in UPDATE) UPDATE.care_spider();
      if ('train_mat' in UPDATE) UPDATE.train_mat();
      if ('protect_mat' in UPDATE) UPDATE.protect_mat();
      if ('appearance_scatter' in UPDATE) UPDATE.appearance_scatter();
   }

   draw();
   UPDATE['rank_bar'] = draw;
}

const plotRankLine = () => {
   const marginSvg = {
      top: 20, 
      right: 10,
      bottom: 20,
      left: 30
   };
   const widthSvg = 285 - marginSvg.left - marginSvg.right;
   const heightSvg = 240 - marginSvg.bottom - marginSvg.top;

   // Add div inside the plot_breed_rank plot.
   const div = d3.select('#plot_rank_line')
                 .append('div');
   const svg = div.append('svg')
                   .attr("width", widthSvg + marginSvg.left + marginSvg.right)
                   .attr("height", heightSvg + marginSvg.top + marginSvg.bottom);

   // Add the timeline x axis.
   const gX = svg.append('g')
                 .attr("transform", `translate(${marginSvg.left},${heightSvg-marginSvg.bottom})`);
   const xScale = d3.scaleBand()
                    .domain(YEARS)
                    .range([0, widthSvg]);
   const labelX = svg.append('g')
   labelX.append('text')
         .text('Years ►')
         .style('font-size', '12px')
         .attr('transform', `translate(${marginSvg.left+10},${marginSvg.top+heightSvg+marginSvg.bottom-15})`)

   const xAxis = gX.append('g');
   const xAxisElem = xAxis.call(d3.axisBottom(xScale));
   xAxisElem.selectAll('path').remove();
   const ticks = xAxisElem.selectAll('.tick');
   ticks.selectAll('text')
      .attr('transform', `rotate(-45) translate(-10)`)
   ticks.selectAll('line').remove();
   ticks.append('circle')
        .attr('class', 'yearCircle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', d => d == SELECTED_YEAR ? 'red' : 'gray')
        .on("mouseover", function (event, d) {
            const year = d;
            if (year != SELECTED_YEAR) {
               d3.select(this)
                  .transition()
                  .duration(500)
                  .attr('fill', 'orange');
            }
        })
        .on("mouseout", function (event, d) {
            const year = d;
            if (year != SELECTED_YEAR) {
               d3.select(this)
                  .transition()
                  .duration(500)
                  .attr('fill', 'gray');
            }
        })
        .on("click", function (event, d) {
            const year = d;
            SELECTED_YEAR = year;
            d3.selectAll('.yearCircle')
            .transition()
            .duration(500)
            .attr('fill', 'gray');
            d3.select(this)
            .transition()
            .duration(500)
            .attr('fill', 'red');
            UPDATE.rank_bar();
        });


   // Add the timeline y axis.
   gY = svg.append('g')
           .attr("transform", `translate(${marginSvg.left},${marginSvg.top})`);
   const yAxis = gY.append('g');
   const yPlot = gY.append('g');
  
   // Add y axis line.
   var breedData;
   // var avgData;
   const plot_breed_rank_change = () => {
      breedData = DATA[SELECTED_BREED];
      let rankChangeBreed = [];
      YEARS.forEach((year) => rankChangeBreed.push({'year':year, 'rank':breedData[`rank_${year}`]}));
      const rankChangeExtent = d3.extent(rankChangeBreed.map(d => d.rank));
      const yScale = d3.scaleLinear()
                     .domain([rankChangeExtent[1], rankChangeExtent[0]])
                     .range([heightSvg-marginSvg.bottom-marginSvg.top, 0]);

      let pBreed = [];
      rankChangeBreed.forEach(yearRank => pBreed.push([
         xScale(yearRank.year) + xScale.bandwidth()/2, 
         yScale(yearRank.rank)
      ]));
      pBreed = d3.line()(pBreed);
      yPlot.selectAll('.breedRankChange')
         .data([pBreed])
         .join('path')
         .attr('class', 'breedRankChange')
         .attr("fill", "none")
         .attr("stroke", "blue")
         .attr("stroke-width", 1.5)
         .transition()
         .duration(1000)
         .attr("d", d => d);
      yPlot.selectAll('.breedRankChangeLabel')
         .data(Array.from(Object.values(rankChangeBreed)))
         .join('text')
         .text(d => d.rank)
         .attr('class', 'breedRankChangeLabel')
         .style("font-size", "9px")
         .transition()
         .duration(1000)
         .attr("transform", d => `translate(${xScale(d.year)+(xScale.bandwidth()/2)+5},${yScale(d.rank)-3})`);
      
      yAxis.transition()
         .duration(1000)
         .call(d3.axisLeft(yScale));
   }

   plot_breed_rank_change();
   UPDATE['rank_line'] = plot_breed_rank_change;

   // Add legend.
   const gLegend = svg.append('g');
   gLegend.append('rect')
         .attr('x',  (marginSvg.left+widthSvg)-90)
         .attr('y', marginSvg.top+heightSvg+marginSvg.bottom-20)
         .attr('height', 3)
         .attr('width', 10)
         .attr('fill', 'blue');
   gLegend.append('text')
         .text('Selected Breed')
         .style('font-size', '10px')
         .attr('transform', `translate(${(marginSvg.left+widthSvg)-75},${marginSvg.top+heightSvg+marginSvg.bottom-15})`);
}

// PLOT IMAGE DATA
const plotImageData = () => {
   const draw = () => {
      let url;
      Object.entries(DATA).forEach(d => {
         if (d[0] == SELECTED_BREED) {
            url = d[1].image;
         }
      })

      d3.select('#plot_image')
      .style('background-image', `url(${url})`);

      d3.select('#heading_image')
      .html(`Selected Breed = ${SELECTED_BREED.toLocaleUpperCase()}`);
   }
   
   UPDATE['image'] = draw;
   draw();
}

// PLOT CARE DATA
const plotCareData = () => {
   const features = ['Shedding Level', 'Grooming Frequency', 'Energy Level', 'Drooling Level', 'Mental Stimulation Needs'];
   const legend = {};
   features.forEach(f => {
      legend[f] = f.toLowerCase().split(' ').join('_')
   });
  
   // Add an svg inside a div.
   const widthSvg = 300;
   const heightSvg = 235;
   const marginSvg = {top: 0, right: 0, bottom: 0, left: 0};
   const svg = d3.select('#plot_care')
               .append('div')
               .append('svg')
               .attr('width', widthSvg-marginSvg.left-marginSvg.right)
               .attr('height', heightSvg-marginSvg.top-marginSvg.bottom);
   const legend_svg = d3.select('#legend_care_home')
                        .append('svg')
                        .attr('width', widthSvg)
                        .attr('height', 20);
   // Add legend.
   const gLegendAllBreeds = legend_svg.append('g');
   gLegendAllBreeds.append('circle')
                  .attr('cx',  6)
                  .attr('cy', 6+2)
                  .attr('r', 6)
                  .attr('fill', 'black')
                  .attr('opacity', 0.3);
   gLegendAllBreeds.append('text')
                  .text('All Breeds (Avg.)')
                  .style('font-size', '14px')
                  .attr('transform', `translate(${18},${13})`);
   gLegendAllBreeds.attr('transform', `translate(${20},${0})`);
   const gLegendSelectedBreed = legend_svg.append('g');
   gLegendSelectedBreed.append('circle')
                     .attr('cx',  6)
                     .attr('cy', 6+2)
                     .attr('r', 6)
                     .attr('fill', 'blue')
                     .attr('opacity', 0.3);
   gLegendSelectedBreed.append('text')
                     .text('Selected Breed')
                     .style('font-size', '14px')
                     .attr('transform', `translate(${18},${13})`);
   gLegendSelectedBreed.attr('transform', `translate(${widthSvg-130},${0})`);

   // Plot grid lines.
   const diameter = 235-60;
   const radialScale = d3.scaleLinear()
                        .domain([0, 5])
                        .range([0, diameter/2]);
   const ticks = [1, 2, 3, 4, 5,];
   const gGridLines = svg.append('g');
   gGridLines.selectAll('circle')
            .data(ticks)
            .join(
               enter => enter.append('circle')
                           .attr('cx', widthSvg/2)
                           .attr('cy', heightSvg/2)
                           .attr('fill', 'none')
                           .attr('stroke', 'gray')
                           .attr('r', d => radialScale(d))
            );

   // Plot axes.
   const angleToCoordinate = (angle, value) => {
      /** Function that maps polar angle to svg coordinates. */
      let x = Math.cos(angle) * radialScale(value);
      let y = Math.sin(angle) * radialScale(value);
      return {"x": widthSvg/2+x, "y": heightSvg/2-y};
   }

   const axisLines = features.map((f, i) => {
      const angle = (Math.PI/2) + (2*Math.PI*i/features.length);
      return {
         "name": f,
         "angle": angle,
         "line_coord": angleToCoordinate(angle, 5),
         "label_coord": angleToCoordinate(angle, 6)
      };
   });

   const gAxisLines = svg.append('g');
   gAxisLines.selectAll('.axisLineCare')
            .data(axisLines)
            .join('line')
            .attr('class', 'axisLineCare')
            .attr('x1', widthSvg/2)
            .attr('y1', heightSvg/2)
            .attr('x2', d => d.line_coord.x)
            .attr('y2', d => d.line_coord.y)
            .attr('stroke', 'black');
   const gAxisLabels = svg.append('g');
   gAxisLabels.selectAll('.axisLabelCare')
            .data(axisLines)
            .join('text')
            .attr('class', 'axisLabelCare')
            .attr('x', d => d.label_coord.x)
            .attr('y', d => d.label_coord.y)
            .text(d => d.name)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('transform', (d, i) => {
               let rotation_angle = -1*i*(360/(features.length));
               if (-250 <= rotation_angle && rotation_angle <= -100) {
                  rotation_angle = rotation_angle+180;
               }             
               return `rotate(${rotation_angle}, ${d.label_coord.x}, ${d.label_coord.y})`
            })
            .style('font-size', '10px');
   
   // Plot data shape.
   const line = d3.line().x(d => d.x).y(d => d.y); // line generator
   const getPathCoordinates = (data_point) => {
      /** Maps input care data point to coordinates on the spider plot. */
         let coordinates = [];
         for (let i = 0; i < features.length; i++){
            let name = features[i];
            let angle = (Math.PI/2)+(2*Math.PI*i/features.length);
            coordinates.push(angleToCoordinate(angle, data_point[name]));
         }
         return coordinates;
   }
   const gShape = svg.append('g');
   const colorScale = d3.scaleOrdinal().range(['blue', 'black']);
   const draw_paths = () => {
      /** Draws the data polygon on the spired chart using paths. */
      // get data
      const breedData = DATA[SELECTED_BREED];
      var spiderData = {};
      features.forEach(f => spiderData[f] = breedData[legend[f]]);
      spiderData = [spiderData];
      let avgData = {};
      getFilteredData().forEach(d => {
         Object.entries(legend).forEach(([k,v]) => {
            if (k in avgData) avgData[k] = (avgData[k]+d[v])/2;
            else avgData[k] = d[v];
         });
      });
      Object.keys(avgData).forEach(k => {
         avgData[k] = Math.round(avgData[k]);
      })
      spiderData.push(avgData);

      // plot data
      gShape.selectAll("path")
            .data(spiderData)
            .join('path')
            .datum(d => getPathCoordinates(d))
            .transition()
            .duration(1000)
            .attr("d", line)
            .attr("stroke-width", 3)
            .attr("fill", (d, i) => colorScale(i))
            .attr("stroke-opacity", 1)
            .attr("opacity", 0.3);
   }
   draw_paths();
   UPDATE['care_spider'] = draw_paths;

   // Plot handles.
   var axisHandles = [];
   let dataHasFeatureValue;
   let handle;
   let angle;
   for (let i=1; i<=5; i++) { // Each feature has range [1, 5].
      handle = [];
      for(let j=0; j<features.length; j++) { // There are 5 features.
         let f = features[j];
         dataHasFeatureValue = false;
         Object.values(DATA).forEach(row => {
            if (row[legend[f]] == i) dataHasFeatureValue = true;
         });
         if (dataHasFeatureValue) {
            angle = (Math.PI/2) + (2*Math.PI*j/features.length);
            handle.push({
               "angle": angle,
               "coord": angleToCoordinate(angle, i),
               "feature": f,
               "value": i
            });
         }
      }
      axisHandles = axisHandles.concat(handle);
   } 
   const gAxisHandles = svg.append('g');
   const handles = gAxisHandles.selectAll('.axisHandle')
                              .data(axisHandles)
                              .join('circle')
                              .attr('class', 'axisHandle')
                              .attr('cx', d => d.coord.x)
                              .attr('cy', d => d.coord.y)
                              .attr('stroke', 'black')
                              .attr('r', 4)
                              .attr('fill', 'white');

   // Spider plot selection mechanism.
   var selection = {};
   features.forEach(f => selection[f] = {'value':0, 'element':null});
   handles.on('mouseover', function(event, d) {
      if (selection[d.feature].value == 0 || selection[d.feature].value != d.value) {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'orange');
      } else {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'blue');
      }
   }).on('mouseout', function(event, d) {
      if (selection[d.feature].value == 0 || selection[d.feature].value != d.value) {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'white');
      } else {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'red');
      }
   }).on('click', function(event, d) {
      if (selection[d.feature].value == 0) { // different feature value selected
         selection[d.feature].value = d.value
         selection[d.feature].element = d3.select(this);
      } else if (selection[d.feature].value != d.value) { // same feature different value selected
         selection[d.feature].element
                           .transition()
                           .duration(500)
                           .attr('fill', 'white');
         selection[d.feature].value = d.value
         selection[d.feature].element = d3.select(this)
      } else { // same feature same value selected
         selection[d.feature].element
                           .transition()
                           .duration(500)
                           .attr('fill', 'white');
         selection[d.feature].value = 0;
         selection[d.feature].element = null;
      }

      d3.select(this)
      .transition()
      .duration(500)
      .attr('fill', (selection[d.feature] == 0) ? 'orange' : 'red');

      // Filter mechanism.
      Object.entries(selection).forEach(([k, v]) => {
         if (v.value > 0) FILTERS[legend[k]] = v.value;
         else FILTERS[legend[k]] = null;
      });

      UPDATE.rank_bar();
   });

   const gridLabels = svg.append('g');
   gridLabels.selectAll('.tickLabelCare')
            .data(ticks)
            .join('text')
            .attr('class', '.tickLabelCare')
            .attr('x', widthSvg/2 - 8)
            .attr('y', d => heightSvg/2 - radialScale(d) + 10)
            .text(d => d)
            .style('font-weight', 'bold')
            .style('font-size', '9px');
}

// PLOT HOME FRIENDLINESS DATA
const plotHomeData = () => {
   const features = ['Affection Level', 'Adaptability', 'Child Friendliness', 'Dog Friendliness', 'Playfulness'];
   const legend = {};
   features.forEach(f => legend[f] = f.toLowerCase().split(' ').join('_'));

   // Add an svg inside a div.
   const widthSvg = 300;
   const heightSvg = 235;
   marginSvg = {top: 0, right: 0, bottom: 0, left: 0};
   const svg = d3.select('#plot_home')
               .append('div')
               .append('svg')
               .attr('width', widthSvg-marginSvg.left-marginSvg.right)
               .attr('height', heightSvg-marginSvg.top-marginSvg.bottom);

   // Plot grid lines.
   const diameter = 235-60;
   const radialScale = d3.scaleLinear()
                        .domain([0, 5])
                        .range([0, diameter/2]);
   const ticks = [1, 2, 3, 4, 5,];
   const gGridLines = svg.append('g');
   gGridLines.selectAll('circle')
            .data(ticks)
            .join(
               enter => enter.append('circle')
                           .attr('cx', widthSvg/2)
                           .attr('cy', heightSvg/2)
                           .attr('fill', 'none')
                           .attr('stroke', 'gray')
                           .attr('r', d => radialScale(d))
            );

   // Plot axes.
   const angleToCoordinate = (angle, value) => {
      /** Function that maps polar angle to svg coordinates. */
      let x = Math.cos(angle) * radialScale(value);
      let y = Math.sin(angle) * radialScale(value);
      return {"x": widthSvg/2+x, "y": heightSvg/2-y};
   }

   const axisLines = features.map((f, i) => {
      const angle = (Math.PI/2) + (2*Math.PI*i/features.length);
      return {
         "name": f,
         "angle": angle,
         "line_coord": angleToCoordinate(angle, 5),
         "label_coord": angleToCoordinate(angle, 6)
      };
   });

   const gAxisLines = svg.append('g');
   gAxisLines.selectAll('.axisLineHome')
            .data(axisLines)
            .join('line')
            .attr('class', 'axisLineHome')
            .attr('x1', widthSvg/2)
            .attr('y1', heightSvg/2)
            .attr('x2', d => d.line_coord.x)
            .attr('y2', d => d.line_coord.y)
            .attr('stroke', 'black');
   const gAxisLabels = svg.append('g');
   gAxisLabels.selectAll('.axisLabelHome')
            .data(axisLines)
            .join('text')
            .attr('class', 'axisLabelHome')
            .attr('x', d => d.label_coord.x)
            .attr('y', d => d.label_coord.y)
            .text(d => d.name)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('transform', (d, i) => {
               let rotation_angle = -1*i*(360/(features.length));
               if (-250 <= rotation_angle && rotation_angle <= -100) {
                  rotation_angle = rotation_angle+180;
               }             
               return `rotate(${rotation_angle}, ${d.label_coord.x}, ${d.label_coord.y})`;
            })
            .style('font-size', '10px');
   
   // Plot data shape.
   const line = d3.line().x(d => d.x).y(d => d.y); // line generator
   const getPathCoordinates = (data_point) => {
      /** Maps input care data point to coordinates on the spider plot. */
         let coordinates = [];
         for (let i = 0; i < features.length; i++){
            let name = features[i];
            let angle = (Math.PI/2)+(2*Math.PI*i/features.length);
            coordinates.push(angleToCoordinate(angle, data_point[name]));
         }
         return coordinates;
   }
   const gShape = svg.append('g');
   const colorScale = d3.scaleOrdinal().range(['blue', 'black']);
   const draw_paths = () => {
      /** Draws the data polygon on the spired chart using paths. */
      // get data
      const breedData = DATA[SELECTED_BREED];
      var spiderData = {};
      features.forEach(f => spiderData[f] = breedData[legend[f]]);
      spiderData = [spiderData];
      let avgData = {};
      getFilteredData().forEach(d => {
         Object.entries(legend).forEach(([k,v]) => {
            if (k in avgData) avgData[k] = (avgData[k]+d[v])/2;
            else avgData[k] = d[v];
         });
      });
      Object.keys(avgData).forEach(k => {
         avgData[k] = Math.round(avgData[k]);
      })
      spiderData.push(avgData);

      // plot data
      gShape.selectAll("path")
            .data(spiderData)
            .join('path')
            .datum(d => getPathCoordinates(d))
            .transition()
            .duration(1000)
            .attr("d", line)
            .attr("stroke-width", 3)
            .attr("fill", (d, i) => colorScale(i))
            .attr("stroke-opacity", 1)
            .attr("opacity", 0.3)
   }
   draw_paths();
   UPDATE['home_spider'] = draw_paths;

   // Plot handles.
   var axisHandles = [];
   let dataHasFeatureValue;
   let handle;
   let angle;
   for (let i=1; i<=5; i++) { // Each feature has range [1, 5].
      handle = [];
      for(let j=0; j<features.length; j++) { // There are 5 features.
         let f = features[j];
         dataHasFeatureValue = false;
         Object.values(DATA).forEach(row => {
            if (row[legend[f]] == i) dataHasFeatureValue = true;
         });
         if (dataHasFeatureValue) {
            angle = (Math.PI/2) + (2*Math.PI*j/features.length);
            handle.push({
               "angle": angle,
               "coord": angleToCoordinate(angle, i),
               "feature": f,
               "value": i
            });
         }
      }
      axisHandles = axisHandles.concat(handle);
   }
   const gAxisHandles = svg.append('g');
   const handles = gAxisHandles.selectAll('.axisHandle')
                              .data(axisHandles)
                              .join('circle')
                              .attr('class', 'axisHandle')
                              .attr('cx', d => d.coord.x)
                              .attr('cy', d => d.coord.y)
                              .attr('r', 4)
                              .attr('stroke', 'black')
                              .attr('fill', 'white');

   // Spider plot selection mechanism.
   var selection = {};
   features.forEach(f => selection[f] = {'value':0, 'element':null});
   handles.on('mouseover', function(event, d) {
      if (selection[d.feature].value == 0 || selection[d.feature].value != d.value) {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'orange');
      } else {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'blue');
      }
   }).on('mouseout', function(event, d) {
      if (selection[d.feature].value == 0 || selection[d.feature].value != d.value) {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'white');
      } else {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'red');
      }
   }).on('click', function(event, d) {
      if (selection[d.feature].value == 0) { // different feature value selected
         selection[d.feature].value = d.value
         selection[d.feature].element = d3.select(this);
      } else if (selection[d.feature].value != d.value) { // same feature different value selected
         selection[d.feature].element
                           .transition()
                           .duration(500)
                           .attr('fill', 'white');
         selection[d.feature].value = d.value
         selection[d.feature].element = d3.select(this)
      } else { // same feature same value selected
         selection[d.feature].element
                           .transition()
                           .duration(500)
                           .attr('fill', 'white');
         selection[d.feature].value = 0;
         selection[d.feature].element = null;
      }
      d3.select(this)
      .transition()
      .duration(500)
      .attr('fill', (selection[d.feature] == 0) ? 'orange' : 'red');

      // Filter mechanism.
      Object.entries(selection).forEach(([k, v]) => {
         if (v.value > 0) FILTERS[legend[k]] = v.value;
         else FILTERS[legend[k]] = null;
      });

      UPDATE.rank_bar();
   });

   const gridLabels = svg.append('g');
   gridLabels.selectAll('.tickLabelHome')
            .data(ticks)
            .join('text')
            .attr('class', '.tickLabelHome')
            .attr('x', widthSvg/2 - 8)
            .attr('y', d => heightSvg/2 - radialScale(d) + 10)
            .text(d => d)
            .style('font-size', '9px')
            .style('font-weight', 'bold')
            .attr('fill', 'black');
}

// PLOT TRAINING DATA
const plotTrainData = () => {
   // Add svg inside div.
   const marginSvg = {top: 10, right: 120, bottom: 40, left: 50};
   const widthSvg = 580 - marginSvg.left - marginSvg.right;
   const heightSvg = 235  - marginSvg.top - marginSvg.bottom;
   
   const div = d3.select('#plot_train')
                 .append('div');

   const svg = div.append('svg')
                  .attr("width", widthSvg + marginSvg.left + marginSvg.right)
                  .attr("height", heightSvg + marginSvg.top + marginSvg.bottom);
   
   // Add x axis = trainability.
   const gX = svg.append('g')
               .attr("transform", `translate(${marginSvg.left},${heightSvg+marginSvg.top})`);
   const xScale = d3.scaleBand()
                    .domain([1, 2, 3, 4, 5])
                    .range([0, widthSvg])
                    .padding(0.05);
   const xAxis = gX.append('g');
   const xAxisElem = xAxis.call(d3.axisBottom(xScale));
   xAxisElem.selectAll('path')
            .remove();
   xAxisElem.selectAll('line')
            .remove();
   xAxisElem.selectAll('.tick')
            .attr('transform', d => {
               return `translate(${xScale(d)+(xScale.bandwidth()/2)},${-5})`
            });

   // Add y axis = working intelligence level.
   const gY = svg.append('g')
               .attr("transform", `translate(${marginSvg.left},${marginSvg.top})`);
   const yScale = d3.scaleBand()
                    .domain([1, 2, 3, 4, 5])
                    .range([heightSvg, 0])
                    .padding(0.05);
   const yAxis = gY.append('g');
   const yAxisElem = yAxis.call(d3.axisLeft(yScale));
   yAxisElem.selectAll('path')
            .remove();
   yAxisElem.selectAll('line')
            .remove();

   // For pie chart.
   const radius = xScale.bandwidth()/5;
   const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

   // Color scale.
   const colorScaleSquares = d3.scaleSequential()
                              .domain(DATA_EXTENT.reps_avg)
                              .range(['#cccccc', '#00f7ff']);
   const colorScalePie = d3.scaleOrdinal().range(['yellow', 'gray']);
   
   // Add squares.
   const gSquares = svg.append('g')
                       .attr("transform", `translate(${marginSvg.left},${marginSvg.top})`);
   const gBreedSquare = svg.append('g');
   const gBreedPie = svg.append('g').attr('class', 'trainBreedPie');

   
   // Add color legend.
   const gLegend = svg.append("g");
   const colorLegend = gLegend.append('g')
                              .attr('id', 'train_legend_reps_avg')
                              .attr('transform', `translate(${widthSvg+marginSvg.left+marginSvg.right-85},${heightSvg+marginSvg.bottom-95})`)
                              .call(d3.legendColor().scale(colorScaleSquares))
   colorLegend.selectAll('text')
            .style('font-size', '12px');
   colorLegend.selectAll('rect')
            .attr('stroke', 'black');
   gLegend.append('text')
         .text('Avg. No. of')
         .style('font-size', '12px')
         .attr('transform', `translate(${widthSvg+marginSvg.left+30},${heightSvg+marginSvg.top-88})`)
   gLegend.append('text')
         .text('Repetitions')
         .style('font-size', '12px')
         .style('text-decoration', 'underline')
         .attr('transform', `translate(${widthSvg+marginSvg.left+30},${heightSvg+marginSvg.top-73})`)
   gLegend.append('text')
         .text('Working Intelligence Level')
         .style('font-style', 'italic')
         .style('letter-spacing', '1.5px')
         .style('word-spacing', '3px')
         .style('font-size', '12px')
         .attr('transform', `rotate(-90) translate(${-(heightSvg+10)},${marginSvg.left-30})`);
   gLegend.append('text')
         .text('Trainability')
         .style('font-style', 'italic')
         .style('letter-spacing', '1.5px')
         .style('word-spacing', '3px')
         .style('font-size', '12px')
         .attr('transform', `translate(${widthSvg/1.8},${heightSvg+marginSvg.top+27})`)
   gLegend.append('circle')
         .attr('r', 10)
         .attr('cx', widthSvg+marginSvg.left+20)
         .attr('cy', marginSvg.top+(heightSvg/3)+5)
         .attr('stroke', 'black')
         .attr('fill', 'yellow')
   gLegend.append('text')
         .text('Obedience')
         .style('font-size', '11px')
         .attr('transform', `translate(${widthSvg+marginSvg.left+35},${marginSvg.top+(heightSvg/3)+3})`);
   gLegend.append('text')
         .text('Probability (Avg.)')
         .style('font-size', '11px')
         .attr('transform', `translate(${widthSvg+marginSvg.left+35},${marginSvg.top+(heightSvg/3)+15})`);
   gLegend.append('text')
         .text('Selected Breed')
         .style('font-size', '9px')
         .attr('fill', 'blue')
         .attr('transform', `translate(${widthSvg+marginSvg.left+27},${9})`);

   var selected = {
      'trainability': {'value':null, 'element':null}, 
      'working_intelligence_level': {'value':null, 'element':null}
   };

   const clearSelected = () => {
      selected = {
         'trainability': {'value':null, 'element':null}, 
         'working_intelligence_level': {'value':null, 'element':null}
      }
   }

   UPDATE['clear_train'] = clearSelected;

   const draw = () => {
      // Get data.
      var data = {};
      var breedData = [];
      
      for (let i=1; i<=5; i++) {
         for (let j=1; j<=5; j++) {
            data[[i,j]] = {'reps_avg':0, 'obedience_prob':0};
         }
      }
      
      Object.values(getFilteredData()).forEach((d) => {
         const idx = [d.trainability, d.working_intelligence_level];
         if (data[idx].reps_avg == 0) data[idx].reps_avg = d.reps_avg;
         else data[idx].reps_avg = (data[idx].reps_avg+d.reps_avg)/2;
         if (data[idx].obedience_prob == 0) data[idx].obedience_prob = d.obedience_prob;
         else data[idx].obedience_prob = (data[idx].obedience_prob+d.obedience_prob)/2;
      });

      Object.values(DATA).forEach(d => {
         if (d.breed == SELECTED_BREED) {
            breedData.push({
               'reps_avg': d.reps_avg,
               'obedience_prob': d.obedience_prob,
               'trainability': d.trainability,
               'working_intelligence_level': d.working_intelligence_level
            });
         }
      })
      
      data = Object.entries(data).map(d => {
         d[0] = JSON.parse("[" + d[0] + "]");
         return {
            'trainability': d[0][0],
            'working_intelligence_level': d[0][1],
            'obedience_prob': d[1].obedience_prob,
            'reps_avg': d[1].reps_avg
         }
      });
   
      // Draw squares.
      gSquares.selectAll('.trainSquare')
            .data(data)
            .join('rect')
            .attr('class', 'trainSquare')
            .attr('x', d => xScale(d.trainability))
            .attr('y', d => yScale(d.working_intelligence_level))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('opacity', 1)
            .attr('stroke', d => (selected.trainability.value == d.trainability && selected.working_intelligence_level.value == d.working_intelligence_level) ? 'red' : 'black')
            .attr('stroke-width', d => (selected.trainability.value == d.trainability && selected.working_intelligence_level.value == d.working_intelligence_level) ? '3px' : '1px')
            .attr('fill', d => (d.reps_avg > 0) ? colorScaleSquares(d.reps_avg) : 'white')
            .on('mouseover', function(e, d) {
               if (d.reps_avg != 0) { 
                  d3.select(this)
                  .transition()
                  .duration(500)
                  .attr('stroke-width', '3px')
                  .attr('stroke', 'orange');
               }
            })
            .on('mouseout', function(e, d) {
               if (d.reps_avg != 0) { 
                  if (!(selected.trainability.value == d.trainability && selected.working_intelligence_level.value == d.working_intelligence_level)) {
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '1px')
                     .attr('stroke', 'black');
                  } else {
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '3px')
                     .attr('stroke', 'red');
                  }
               }
            })
            .on('click', function (e, d) {
               if (d.reps_avg > 0) {
                  if (selected.trainability.value == d.trainability && selected.working_intelligence_level.value == d.working_intelligence_level) { // clicked last clicked square
                     selected.trainability.value = null;
                     selected.working_intelligence_level.value = null;
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '1px')
                     .attr('stroke', 'black');
                     selected.trainability.element = null;
                     selected.working_intelligence_level.value = null;
                  } else { // did not click last clicked square
                     selected.trainability.value = d.trainability;
                     selected.working_intelligence_level.value = d.working_intelligence_level;
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '3px')
                     .attr('stroke', 'red');
                     if (selected.trainability.element != null) {
                        selected.trainability.element
                        .transition()
                        .duration(500)
                        .attr('stroke-width', '1px')
                        .attr('stroke', 'black');
                     }
                     selected.trainability.element = d3.select(this);
                     selected.working_intelligence_level.element = d3.select(this);
                  }
                  Object.entries(selected).forEach(([k, v]) => FILTERS[k] = v.value);
                  UPDATE.rank_bar();
               }
            });

      gSquares.selectAll('.trainCircle')
            .data(breedData)
            .join('circle')
            .attr('class', 'trainCircle')
            .transition()
            .duration(1000)
            .attr('r', radius/3)
            .attr('cx', d => xScale(d.trainability)+xScale.bandwidth()-((radius/3)*2))
            .attr('cy', d => yScale(d.working_intelligence_level)+yScale.bandwidth()-((radius/3)*2))
            .attr('fill', 'blue');

      gSquares.selectAll('text')
            .data(data)
            .join('text')
            .text(d => (d.reps_avg > 0) ? d.reps_avg : "")
            .style('font-size', '9px')
            .style('font-weight', 'bold')
            .attr('transform', d => `translate(${xScale(d.trainability)+2},${yScale(d.working_intelligence_level)+10})`);
            
      gBreedSquare.selectAll('.trainBreedSquare')
                  .data(breedData)
                  .join('rect')
                  .attr('class', 'trainBreedSquare')
                  .attr('x', widthSvg+marginSvg.left+20)
                  .attr('y', marginSvg.top+3)
                  .attr('width', xScale.bandwidth())
                  .attr('height', yScale.bandwidth())
                  .transition()
                  .duration(1000)
                  .attr('stroke', 'blue')
                  .attr('stroke-width', '2')
                  .attr('fill', d => colorScaleSquares(d.reps_avg))
      gBreedSquare.selectAll('text')
                  .data(breedData)
                  .join('text')
                  .text(d => d.reps_avg)
                  .style('font-size', '9px')
                  .style('font-weight', 'bold')
                  .attr('transform', `translate(${widthSvg+marginSvg.left+23},${marginSvg.top+13})`);

      // Pie chart
      const dataPie = [];
      data.forEach(d => {
         if (d.obedience_prob > 0) {
            dataPie.push({
               'xy':[d.trainability, d.working_intelligence_level],
               'pie': [
                  {'property': 'pc', 'value': d.obedience_prob},
                  {'property': '100-pc', 'value': (d.obedience_prob != 50) ? 100-d.obedience_prob : 49.9}
               ]
            });
         }
      });

      var dataFormatted = dataPie.map(d => {
         let dPie = d3.pie().value(d => d.value)(d.pie);
         dPie.forEach(p => p['xy'] = d.xy);
         return dPie
      });

      const pies = svg.selectAll('.trainPie')
                     .data(dataFormatted)
                     .join('g')
                     .attr('class', 'trainPie')
                     .attr('transform', `translate(${marginSvg.left},${marginSvg.top})`);
                     
      pies.selectAll('path')
         .data(d => d)
         .join('path')
         .transition()
         .duration(1000)
         .attr('d', d => arcGenerator(d))
         .attr('fill', (d, i) => colorScalePie(i))
         .attr('stroke', 'black')
         .attr('transform', d => `translate(${xScale(d.xy[0])+xScale.bandwidth()/2},${yScale(d.xy[1])+yScale.bandwidth()/2})`);

      gBreedPie.selectAll('path')
               .data(() => {
                  let dPie = d3.pie().value(d => d.value)([
                     {'property': 'pc', 'value': breedData[0].obedience_prob},
                     {'property': '100-pc', 'value': 100-breedData[0].obedience_prob}
                  ]);
                  return dPie;
               })
               .join('path')
               .transition()
               .duration(1000)
               .attr('d', d => arcGenerator(d))
               .attr('fill', (d, i) => colorScalePie(i))
               .attr('stroke', 'blue')
               .attr('transform', `translate(${widthSvg+marginSvg.left+25+(xScale.bandwidth()/2)-5},${marginSvg.top+20})`);
      gBreedPie.selectAll('text')
               .data(breedData)
               .join('text')
               .text(d => `${d.obedience_prob}%`)
               .style('font-size', '9px')
               .style('font-weight', 'bold')
               .attr('transform', `translate(${widthSvg+marginSvg.left+xScale.bandwidth()},${marginSvg.top+yScale.bandwidth()})`);
   }

   draw();
   UPDATE['train_mat'] = draw;
}

// PLOT PROTECTIVENESS DATA
const plotProtectData = () => {
   // Add svg inside div.
   // Add svg inside div.
   const marginSvg = {top: 10, right: 120, bottom: 50, left: 50};
   const widthSvg = 580 - marginSvg.left - marginSvg.right;
   const heightSvg = 235  - marginSvg.top - marginSvg.bottom;
   
   const div = d3.select('#plot_protect')
                 .append('div');

   const svg = div.append('svg')
                  .attr("width", widthSvg + marginSvg.left + marginSvg.right)
                  .attr("height", heightSvg + marginSvg.top + marginSvg.bottom);
   
   // Add x axis = trainability.
   const gX = svg.append('g')
               .attr("transform", `translate(${marginSvg.left},${heightSvg+marginSvg.top})`);
   const xScale = d3.scaleBand()
                    .domain([1, 2, 3, 4, 5])
                    .range([0, widthSvg])
                    .padding(0.05);
   const xAxis = gX.append('g');
   const xAxisElem = xAxis.call(d3.axisBottom(xScale));
   xAxisElem.selectAll('path')
            .remove();
   xAxisElem.selectAll('line')
            .remove();
   xAxisElem.selectAll('.tick')
            .attr('transform', d => `translate(${xScale(d)+(xScale.bandwidth()/2)},${-5})`);

   // Add y axis = working intelligence level.
   const gY = svg.append('g')
               .attr("transform", `translate(${marginSvg.left},${marginSvg.top})`);
   const yScale = d3.scaleBand()
                    .domain([1, 2, 3, 4, 5])
                    .range([heightSvg, 0])
                    .padding(0.05);
   const yAxis = gY.append('g');
   const yAxisElem = yAxis.call(d3.axisLeft(yScale));
   yAxisElem.selectAll('path')
            .remove();
   yAxisElem.selectAll('line')
            .remove();
   
   // Color scale.
   const colorScaleSquares = d3.scaleOrdinal()
                              .domain([1, 2, 3, 4, 5])
                              .range(['#f0dc78', '#ffac5e', '#ff9999', '#bd6da1', '#683e8c']);
   
   // Add squares.
   const gSquares = svg.append('g')
                       .attr("transform", `translate(${marginSvg.left},${marginSvg.top})`);
   const gBreedSquare = svg.append('g');

   // Add legend.
   const gLegend = svg.append("g");
   const colorLegend = gLegend.append('g')
                              .attr('id', 'train_legend_protectiveness')
                              .attr('transform', `translate(${widthSvg+marginSvg.left+45},${heightSvg-60})`)
                              .call(d3.legendColor().scale(colorScaleSquares));
   colorLegend.selectAll('text')
            .style('font-size', '12px');
   colorLegend.selectAll('rect')
            .attr('stroke', 'black');
   gLegend.append('text')
            .text('Average')
            .style('font-size', '12px')
            .attr('transform', `translate(${widthSvg+marginSvg.left+35},${heightSvg+marginSvg.top-100})`)
   gLegend.append('text')
         .text('Protectiveness')
         .style('font-size', '12px')
         .style('text-decoration', 'underline')
         .attr('transform', `translate(${widthSvg+marginSvg.left+20},${heightSvg+marginSvg.top-85})`)
   gLegend.append('text')
         .text('Barking Level')
         .style('font-style', 'italic')
         .style('letter-spacing', '1.5px')
         .style('word-spacing', '3px')
         .style('font-size', '12px')
         .attr('transform', `rotate(-90) translate(${-(heightSvg/1.3)-5},${marginSvg.left-30})`);
   gLegend.append('text')
         .text('Openness to Strangers')
         .style('font-style', 'italic')
         .style('letter-spacing', '1.5px')
         .style('word-spacing', '3px')
         .style('font-size', '12px')
         .attr('transform', `translate(${widthSvg/2.2},${heightSvg+marginSvg.top+30})`);
   gLegend.append('text')
         .text('Selected Breed')
         .style('font-size', '9px')
         .attr('fill', 'blue')
         .attr('transform', `translate(${widthSvg+marginSvg.left+27},${9})`);

   var selected = {
      'openness_to_strangers': {'value':null, 'element':null}, 
      'barking_level': {'value':null, 'element':null}
   };

   const clearSelected = () => {
      selected = {
         'openness_to_strangers': {'value':null, 'element':null}, 
         'barking_level': {'value':null, 'element':null}
      }
   }

   UPDATE['clear_protect'] = clearSelected;

   const radius = xScale.bandwidth()/3;

   const draw = () => {
      // Get data.
      var data = {};
      var breedData = [];
      
      for (let i=1; i<=5; i++) {
         for (let j=1; j<=5; j++) {
            data[[i,j]] = {'protectiveness':0};
         }
      }
      
      Object.values(getFilteredData()).forEach((d) => {
         const idx = [d.openness_to_strangers, d.barking_level];
         if (data[idx].protectiveness == 0) data[idx].protectiveness = d.protectiveness;
         else data[idx].protectiveness = (data[idx].protectiveness+d.protectiveness)/2;
      });

      Object.entries(data).forEach(([k, v]) => { // round to 2 decimal places
         data[k].protectiveness = Math.round(v.protectiveness);
      });

      Object.values(DATA).forEach(d => {
         if (d.breed == SELECTED_BREED) {
            breedData.push({
               'openness_to_strangers': d.openness_to_strangers,
               'barking_level': d.barking_level,
               'protectiveness': d.protectiveness
            });
         }
      })
      
      data = Object.entries(data).map(d => {
         d[0] = JSON.parse("[" + d[0] + "]");
         return {
            'openness_to_strangers': d[0][0],
            'barking_level': d[0][1],
            'protectiveness': d[1].protectiveness
         }
      });
   
      // Draw squares.
      gSquares.selectAll('.protectSquare')
            .data(data)
            .join('rect')
            .attr('class', 'protectSquare')
            .attr('x', d => xScale(d.openness_to_strangers))
            .attr('y', d => yScale(d.barking_level))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('opacity', 1)
            .attr('stroke', d => (selected.openness_to_strangers.value == d.openness_to_strangers && selected.barking_level.value == d.barking_level) ? 'red' : 'black')
            .attr('stroke-width', d => (selected.openness_to_strangers.value == d.openness_to_strangers && selected.barking_level.value == d.barking_level) ? '3px' : '1px')
            .attr('fill', d => (d.protectiveness > 0) ? colorScaleSquares(d.protectiveness) : 'white')
            .on('mouseover', function(e, d) {
               if (d.protectiveness != 0) { 
                  d3.select(this)
                  .transition()
                  .duration(500)
                  .attr('stroke-width', '3px')
                  .attr('stroke', 'orange');
               }
            })
            .on('mouseout', function(e, d) {
               if(d.protectiveness != 0) { 
                  if (!(selected.openness_to_strangers.value == d.openness_to_strangers && selected.barking_level.value == d.barking_level)) {
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '1px')
                     .attr('stroke', 'black');
                  }  else {
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '3px')
                     .attr('stroke', 'red');
                  }
               }
            })
            .on('click', function (e, d) {
               if (d.protectiveness > 0) {
                  if (selected.openness_to_strangers.value == d.openness_to_strangers && selected.barking_level.value == d.barking_level) { // clicked last clicked square
                     selected.openness_to_strangers.value = null;
                     selected.barking_level.value = null;
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '1px')
                     .attr('stroke', 'black');
                     selected.openness_to_strangers.element = null;
                     selected.barking_level.value = null;
                  } else { // did not click last clicked square
                     selected.openness_to_strangers.value = d.openness_to_strangers;
                     selected.barking_level.value = d.barking_level;
                     d3.select(this)
                     .transition()
                     .duration(500)
                     .attr('stroke-width', '3px')
                     .attr('stroke', 'red');
                     if (selected.openness_to_strangers.element != null) {
                        selected.openness_to_strangers.element
                        .transition()
                        .duration(500)
                        .attr('stroke-width', '1px')
                        .attr('stroke', 'black');
                     }
                     selected.openness_to_strangers.element = d3.select(this);
                     selected.barking_level.element = d3.select(this);
                  }
                  Object.entries(selected).forEach(([k, v]) => FILTERS[k] = v.value);
                  UPDATE.rank_bar();
               }
            });

      gSquares.selectAll('.protectCircle')
            .data(breedData)
            .join('circle')
            .attr('class', 'protectCircle')
            .transition()
            .duration(1000)
            .attr('r', radius/5)
            .attr('cx', d => xScale(d.openness_to_strangers)+xScale.bandwidth()-((radius/5)*2))
            .attr('cy', d => yScale(d.barking_level)+yScale.bandwidth()-((radius/5)*2))
            .attr('fill', 'blue');
            
      gBreedSquare.selectAll('.protectBreedSquare')
                  .data(breedData)
                  .join('rect')
                  .attr('class', 'protectBreedSquare')
                  .attr('x', widthSvg+marginSvg.left+20)
                  .attr('y', marginSvg.top+3)
                  .attr('width', xScale.bandwidth())
                  .attr('height', yScale.bandwidth())
                  .transition()
                  .duration(1000)
                  .attr('stroke', 'blue')
                  .attr('stroke-width', '2')
                  .attr('fill', d => colorScaleSquares(d.protectiveness))
   }

   draw();
   UPDATE['protect_mat'] = draw;
}

// PLOT PHYSICAL TRAITS DATA
const plotPhysicalTraitsData = () => {
   // Add an svg inside a div.
   const marginSvg = {top: 50, right: 150, bottom: 50, left: 55};
   const widthSvg = 400 - marginSvg.left - marginSvg.right;
   const heightSvg = 750 - marginSvg.top - marginSvg.bottom;
   const padding = 150;
   
   const div = d3.select('#plot_physical_traits')
                 .append('div');

   const svg = div.append('svg')
                  .attr("width", widthSvg + marginSvg.left + marginSvg.right)
                  .attr("height", heightSvg + marginSvg.top + marginSvg.bottom);

   // Add axes
   gAxes = svg.append('g')
              .attr('transform', `translate(${marginSvg.left},${marginSvg.top})`);
   const colorScale = d3.scaleOrdinal() // coat type
                        .range(['beige', 'green', 'orange', 'yellow', 'magenta', 'cyan', 'pink', 'gray']); 
   const shapeScale = d3.scaleOrdinal()
                        .domain(['short', 'medium', 'long'])
                        .range([d3.symbolCircle, d3.symbolTriangle, d3.symbolSquare]);

   const gLabels = svg.append('g');
   const gScatter= svg.append('g')
                     .attr('transform', `translate(${marginSvg.left},${marginSvg.top})`);

   const sizes = ['teacup', 'toy', 'small', 'medium', 'large', 'giant'];
   const nSizes = sizes.length;
   const heightBandwidth = (heightSvg-((nSizes)*padding))/(nSizes+1);

   // Add labels.
   gLabels.append('text')
         .text('Avg. Height (Inches)')
         .style('font-style', 'italic')
         .style('letter-spacing', '1.5px')
         .style('word-spacing', '3px')
         .style('font-size', '12px')
         .attr('transform', `translate(${(widthSvg/2.5)},${marginSvg.top+heightSvg+marginSvg.bottom-20})`);
   gLabels.append('text')
         .text('Avg. Weight (Pounds)')
         .style('font-style', 'italic')
         .style('letter-spacing', '1.5px')
         .style('word-spacing', '3px')
         .style('font-size', '12px')
         .attr('transform', `rotate(-90) translate(${-(heightSvg/1.45)},${20})`);
   gLabels.append('text')
         .style('font-style', 'italic')
         .style('letter-spacing', '1.5px')
         .style('word-spacing', '3px')
         .text('▲ Size')
         .attr('transform', `translate(${+marginSvg.left+widthSvg+15},${marginSvg.top+heightSvg+35})`);
         // .text('◄ Size')
         // .attr('transform', `rotate(90) translate(${heightSvg},${-(widthSvg+marginSvg.left+70)})`);
   sizes.forEach(() => {
      gLabels.selectAll('.size')
            .data(sizes)
            .join('text')
            .text(d => d)
            .attr('transform', (d, i) => `rotate(90) translate(${(((5-i)*(heightBandwidth+padding))+60)},${-(widthSvg+marginSvg.left+20)})`);
   });

   const selectionLabel = gLabels.append('text')
                                 .style('font-weight', 'bold')
                                 .style('font-size', '12px')
                                 .attr('transform', `translate(${marginSvg.left-25},${20})`);// displays breed, height and weight

   const draw = () => {
      let data = Object.values(getFilteredData()).map(d => {
         return {
            'breed': d.breed,
            'weight': d.weight_avg_lbs,
            'height': d.height_avg_in,
            'size': d.size,
            'coat_length': d.coat_length,
            'coat_type': d.coat_type
         }
      });
      data = data.slice().sort((a, b) => d3.ascending(a.height, b.height));
      let sizeData = Object.fromEntries(d3.group(data, d => d.size).entries());
      let sizeScales = {};

      gAxes.selectAll('.appearanceXAxis')
         .data(Object.entries(sizeData))
         .join('g')
         .attr('class', ([size, values]) => {
            let i = sizes.findIndex(x => x == size);
            let xScale = d3.scaleLinear()
                           .domain(d3.extent(values.map(d => d.height)))
                           .range([0, widthSvg]);
            let yScale = d3.scaleLinear()
                           .domain(d3.extent(values.map(d => d.weight)))
                           .range([(heightSvg)-(i*(heightBandwidth+padding)), (0 + ((5-i)*(heightBandwidth+padding)))]);
            sizeScales[size] = {'x':xScale, 'y':yScale}; 
            return 'appearanceXAxis'
         })
         .transition()
         .duration(1000)
         .each(function ([size, values]) {
            d3.select(this)
            .call(d3.axisBottom(sizeScales[size].x).ticks(4))
            .attr('transform', () => {
               let i = sizes.findIndex(x => x == size);
               return `translate(${0},${(heightSvg)-(i*(heightBandwidth+padding))})`
            });
         });
         
      gAxes.selectAll('.appearanceYAxis')
         .data(Object.entries(sizeData))
         .join('g')
         .attr('class', 'appearanceYAxis')
         .transition()
         .duration(1000)
         .each(function ([size, values]) {
            d3.select(this)
            .call(d3.axisLeft(sizeScales[size].y).ticks(2));
         });
      
      gScatter.selectAll('.appearanceDataPoint')
            .data(data)
            .join('g')
            .attr('class', 'appearanceDataPoint')
            .selectAll('.appearanceSymbol')
            .data(d => [d])
            .join('path')
            .attr('class', 'appearanceSymbol')
            .attr('x', d => sizeScales[d.size].x(d.height))
            .attr('y', d => sizeScales[d.size].y(d.weight))
            .attr('d', d => {
               let symbolSize = 50;
               if (d.breed == SELECTED_BREED) {
                  symbolSize = 300;
                  selectionLabel.text(`${SELECTED_BREED} (${d.height} in, ${d.weight} lbs)`)
                              .transition()
                              .duration(1000)
                              .style('font-style', 'italic')
                              .attr('fill', 'blue');
               }
               return d3.symbol().type(shapeScale(d.coat_length)).size(symbolSize)()
            })
            .transition()
            .duration(500)
            .attr('stroke', d => (d.breed == SELECTED_BREED) ? 'blue': 'black')
            .attr('stroke-width', d => (d.breed == SELECTED_BREED) ? 3: 1)
            .attr('fill', d => colorScale(d.coat_type))
            .style('opacity', 0.5)
            .attr("transform", d => `translate(${sizeScales[d.size].x(d.height)},${sizeScales[d.size].y(d.weight)})`);
         gScatter.selectAll('.appearanceDataPoint')
            .on('mouseover', function(event, d) {
               d3.select(this).raise();
               d3.select(this)
               .select('.appearanceSymbol')
               .attr('transform', `translate(${sizeScales[d.size].x(d.height)},${sizeScales[d.size].y(d.weight)}) scale(2)`)
               .style('opacity', 1)
               .attr('stroke', 'red');

               selectionLabel.text(`${d.breed} (${d.height} in, ${d.weight} lbs)`)
                           .transition()
                           .duration(500)
                           .style('font-style', (d.breed == SELECTED_BREED) ? 'italic' : 'normal')
                           .attr('fill', (d.breed == SELECTED_BREED) ? 'blue' : 'black');
            })
            .on('mouseout', function(event, d) {
               d3.select(this).lower();
               d3.select(this)
               .select('.appearanceSymbol')
               .attr('transform', `translate(${sizeScales[d.size].x(d.height)},${sizeScales[d.size].y(d.weight)}) scale(1)`)
               .style('opacity', 0.5)
               .attr('stroke', (d.breed == SELECTED_BREED) ? 'blue': 'black');
               
               selectionLabel.text(`${SELECTED_BREED} (${DATA[SELECTED_BREED].height_avg_in} in, ${DATA[SELECTED_BREED].weight_avg_lbs} lbs)`)
                           .transition()
                           .duration(500)
                           .attr('fill', 'blue')
                           .style('font-style', 'italic');

            }).on('click', function(event, d) {
               SELECTED_BREED = d.breed;
               UPDATE.rank_bar();
               UPDATE.rank_line();
               UPDATE.care_spider();
               UPDATE.home_spider();
               UPDATE.image();
               UPDATE.train_mat();
               UPDATE.protect_mat();
               UPDATE.appearance_scatter();
            });
   }

   draw();
   UPDATE['appearance_scatter'] = draw;

   // Filter mechanism.
   const selected = {
      'coat_type': {'value':null, 'element':null}, 
      'coat_length': {'value':null, 'element':null}
   };

   // Add legends.
   const gLegend = svg.append("g");
   const colorLegend = gLegend.append('g')
                              .attr('id', 'colorLegend')
                              .attr('transform', `translate(${widthSvg+marginSvg.left+50},${marginSvg.top+135})`)
                              .call(d3.legendColor().scale(colorScale));
   colorLegend.selectAll('rect')
            .attr('stroke', 'black');
   colorLegend.selectAll('rect')
            .on('mouseover', function(event) {
               d3.select(this)
               .transition()
               .duration(500)
               .attr('stroke', 'orange')
               .attr('stroke-width', '3')
            })
            .on('mouseout', function(event, d) {
               let coat_type = d3.select(this.parentNode)._groups[0][0].children[1].innerHTML;
               d3.select(this)
               .transition()
               .duration(500)
               .attr('stroke', (selected.coat_type.value == coat_type) ? 'red' : 'black')
               .attr('stroke-width', (selected.coat_type.value == coat_type) ? '3' : '1');
            })
            .on('click', function(event) {
               let coat_type = d3.select(this.parentNode)._groups[0][0].children[1].innerHTML;
               let element = d3.select(this);

               // previous selection clicked again
               if (selected.coat_type.value == coat_type) {
                  selected.coat_type.value = null;
                  selected.coat_type.element = null;
                  element.transition()
                        .duration(500)
                        .attr('stroke-width', '1')
                        .attr('stroke', 'black');
               } else { // new selection made
                  if(selected.coat_type.value != null) {
                     selected.coat_type.element.transition()
                                             .duration(500)
                                             .attr('stroke-width', '1')
                                             .attr('stroke', 'black');
                  }
                  selected.coat_type.value = coat_type;
                  selected.coat_type.element = element;
                  element.transition()
                        .duration(500)
                        .attr('stroke-width', '3')
                        .attr('stroke', 'red');
               }

               Object.entries(selected).forEach(([k, v]) => FILTERS[k] = v.value);
               
               UPDATE.rank_bar();
               UPDATE.rank_line();
               UPDATE.care_spider();
               UPDATE.home_spider();
               UPDATE.image();
               UPDATE.train_mat();
               UPDATE.protect_mat();
               UPDATE.appearance_scatter();
            });
   gLegend.append('text')
         .text('Coat Type')
         .style('font-size', '14px')
         .style('text-decoration', 'underline')
         .attr('transform', `translate(${widthSvg+marginSvg.left+50},${marginSvg.top+120})`);

   gLegend.selectAll(".legendAppearanceShape")
         .data(['short', 'medium', 'long'])
         .join('path')
         .attr('class', 'legendAppearanceShape')
         .attr('d', d => d3.symbol().type(shapeScale(d)).size(200)())
         .attr("transform", (d,i) => `translate(${(widthSvg+marginSvg.left+60)},${marginSvg.top+70-(25*i)})`)
         .attr('fill', 'black')
         // .attr('stroke', 'none');
   gLegend.selectAll('.legendAppearanceShape')
      .on('mouseover', function(event) {
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', 'orange');
      })
      .on('mouseout', function(event, d) {
         let coat_length = d3.select(`#legendAppearanceShapeText_${d}`).html();
         d3.select(this)
         .transition()
         .duration(500)
         .attr('fill', (selected.coat_length.value == coat_length) ? 'red' : 'black');
      })
      .on('click', function(event, d) {
         let coat_length = d3.select(`#legendAppearanceShapeText_${d}`).html();
         let element = d3.select(this);

         // previous selection clicked again
         if (selected.coat_length.value == coat_length) {
            selected.coat_length.value = null;
            selected.coat_length.element = null;
            element.transition()
                  .duration(500)
                  .attr('fill', 'black');
         } else { // new selection made
            if(selected.coat_length.value != null) {
               selected.coat_length.element.transition()
                                       .duration(500)
                                       .attr('fill', 'black');
            }
            selected.coat_length.value = coat_length;
            selected.coat_length.element = element;
            element.transition()
                  .duration(500)
                  .attr('fill', 'red');
         }

         Object.entries(selected).forEach(([k, v]) => FILTERS[k] = v.value);
         
         UPDATE.rank_bar();
         UPDATE.rank_line();
         UPDATE.care_spider();
         UPDATE.home_spider();
         UPDATE.image();
         UPDATE.train_mat();
         UPDATE.protect_mat();
         UPDATE.appearance_scatter();
      });

   gLegend.selectAll("legendAppearanceShapeText")
         .data(['short', 'medium', 'long'])
         .join('text')
         .attr('id', d => `legendAppearanceShapeText_${d}`)
         .attr("x", widthSvg+marginSvg.left+80)
         .attr("y", (d,i) => marginSvg.top+70-(25*i)+6)
         .text(d => d)
         .style("alignment-baseline", "middle");
   gLegend.append('text')
         .text('Coat Length')
         .style('font-size', '14px')
         .style('text-decoration', 'underline')
         .attr('transform', `translate(${widthSvg+marginSvg.left+50},${marginSvg.top})`);
}

// References: 
// Spider Plot = https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart.