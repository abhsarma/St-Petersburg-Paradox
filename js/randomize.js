var width = 540, 
height = 360, 
xMargin = 60, 
yMargin = 60,
xLabelX = 360,
xLabelY = height,
yLabelX = xMargin + 20,
yLabelY = yMargin + 40;

var xScale, yScale;

function emptyCanvas(){
	d3.select('svg.payoffChart').selectAll('*').remove();
	d3.select('svg.payoffDist').selectAll('*').remove();
}

function emptyUtility(){
	d3.select('svg.utilityFn').selectAll('*').remove();
}

/*
========== draw axis for Line Chart ==========
*/
function drawAxis(num, data){
	maxPay = d3.max(data);

	xScale = d3.scale.linear()
				.domain([0, num])
				.range([xMargin, width - xMargin]);

	yScale = d3.scale.log()
					.domain([1, (maxPay+5)])
					.range([height - yMargin, yMargin])
					.base(2);

	// Define x and y Axis
	var xAxis = d3.svg.axis()
						.scale(xScale)
						.orient("bottom")
						.tickFormat(d3.format("d"));

	var yAxis = d3.svg.axis()
						.scale(yScale)
						.orient("left")
						.ticks("7")
						.tickFormat(d3.format("d"));

	canvas.append("g")
		.attr("class", "axis")
		.attr("id", "xAxis")
		.attr("transform", "translate(0," + (height - yMargin) + ")")
		.call(xAxis);

	canvas.append("g")
		.attr("class", "axis")
		.attr("id", "yAxis")
		.attr("transform", "translate("+ xMargin + ","+ 0 +")")
		.call(yAxis);

	canvas.append("text")
	    .attr("class", "axis-label")
	    .attr("transform", "translate("+ yLabelX +","+ yLabelY +") rotate(-90)")
	    .text("Payoff");

	canvas.append("text")
	    .attr("class", "axis-label")
	    .attr("transform", "translate("+ xLabelX +","+ xLabelY +")")
	    .attr("dy", "-20")
	    .text("Number of Games");
}

function drawPayoff(data){
	var payoffGroup = d3.select('svg.payoffChart')
					.append('g')
					.attr('class', 'payoffGroup');

	/*var line = d3.svg.line()
					.x(function(d, i){ return xScale(i+1); })
					.y(function(d){ return yScale(d); })

	var payoffLine = payoffGroup.append('path')
					.datum(data)
					.attr('class', 'payoffLine')
					.attr('d', line);*/

	var payoffCircle = payoffGroup.selectAll('circle')
						.data(data)
						.enter()
						.append('circle')
						.attr('cx', function(d, i) { return xScale(i+1); })
						.attr('cy', function(d, i) { return yScale(d); })
						.attr('r', function(d, i){
							if (d==0){
								return 0;
							}
							else {
								return 5;
							}
						})
						.attr('fill', '#666');
}

/*
========== draw axis for Histogram ==========
*/
function drawHist(payoff){
	maxPay = d3.max(payoff);
	minPay = d3.min(payoff);

	var xScaleHist = d3.scale.log()
			.domain([minPay, maxPay])
			.range([xMargin, width - xMargin])
			.base(2);

	var histScale = d3.scale.linear()
			.domain([minPay, maxPay])
			.range([xMargin, width - xMargin]);

	var data = d3.layout.histogram()
				.bins(histScale.ticks(maxPay))
				(payoff);

	var countMax = d3.max(data, function(d){return d.length});
	var countMin = d3.min(data, function(d){return d.length});

	yScaleHist = d3.scale.linear()
					.domain([0, countMax])
					.range([height - yMargin, yMargin]);

	// Define x and y Axis
	var xAxisHist = d3.svg.axis()
						.scale(xScaleHist)
						.orient("bottom")
						.tickFormat(d3.format("d"));

	var yAxisHist = d3.svg.axis()
						.scale(yScaleHist)
						.orient("left")
						.ticks("7");

	histogram.append("g")
		.attr("class", "axis")
		.attr("id", "xAxis")
		.attr("transform", "translate(0," + (height - yMargin) + ")")
		.call(xAxisHist);

	histogram.append("g")
		.attr("class", "axis")
		.attr("id", "yAxis")
		.attr("transform", "translate("+ xMargin + ","+ 0 +")")
		.call(yAxisHist);

	histogram.append("text")
	    .attr("class", "axis-label")
	    .attr("transform", "translate("+ yLabelX +","+ yLabelY +") rotate(-90)")
	    .text("Count");

	histogram.append("text")
	    .attr("class", "axis-label")
	    .attr("transform", "translate("+ xLabelX +","+ xLabelY +")")
	    .attr("dy", "-20")
	    .text("Payoff");

	var histGroup = d3.select('svg.payoffDist')
					.append('g')
					.attr('class', 'histGroup');

	var bar = histGroup.selectAll(".bar")
				.data(data)
				.enter().append("g")
				.attr("class", "bar")
				.attr("transform", function(d) { return "translate(" + xScaleHist(d.x) + "," + yScaleHist(d.y) + ")"; });

	bar.append("rect")
	    .attr("x", 1)
	    .attr("width", (xScaleHist(data[0].dx)/2))
	    .attr("height", function(d) { return height - yMargin - yScaleHist(d.y); })
	    .attr("fill", "#4580b0");
}

function quicksort(data, low, high){
	var list = data.slice();
	if (low < high){
		var p = partition(list, low, high);
		quicksort(list, low, p-1);
		quicksort(list, p, high)
	}
	return list;
}

function partition(array, low, high){
	var pivot = array[high];
	i = low;
	for (j=low; j<high; j++){
		if (array[j] <= pivot){
			var swap = array[j];
			array[j] = array[i];
			array[i] = swap;
			i += 1;
		}
	}
	var swap2 = array[high];
	array[high] = array[i];
	array[i] = swap2;
	return i;
}

/*
========== Line chart of the simulations ==========
*/
var canvas = d3.select('div.payoffGame')
				.append('svg')
				.attr('class', 'payoffChart')
				.attr('width', width)
				.attr('height', height);

/*
========== Histogram of the simulations ==========
*/
var histogram = d3.select('div.payoffHist')
				.append('svg')
				.attr('class', 'payoffDist')
				.attr('width', width)
				.attr('height', height);

/*
========== Expectation based on Utility function ==========
*/
var utility = d3.select('div.utilityPlot')
				.append('svg')
				.attr('class', 'utilityFn')
				.attr('width', 900)
				.attr('height', 540);

function calcUtility(max, wealth, cost){
	utilData = [];
	for (k=0; k<max; k++){
		chance = Math.pow(2, k/2);
		var deltaE = (Math.log(wealth + chance - cost) - Math.log(wealth));
		utilData.push(deltaE/chance);
	}
}

function calcMaxSpend(wealth){
	deltaE = 0;
	cost = 0;
	for (cost = 0; cost<1000; cost++){
		for (i=0; i<1000; i++){
			chance = Math.pow(2, i/2);
			deltaE += (Math.log(wealth + chance - cost) - Math.log(wealth))/chance;
		}
		if (deltaE < 0){
			return cost;
		}
	}
}

function plotUtility(max, wealth, cost){
	var xScaleUtil = d3.scale.linear()
				.domain([0, k])
				.range([xMargin, width - xMargin]);

		yScaleUtil = d3.scale.linear()
						.domain([d3.min(utilData), d3.max(utilData)+0.02])
						.range([height - yMargin, yMargin]);

		// Define x and y Axis
		var xAxisUtil = d3.svg.axis()
							.scale(xScaleUtil)
							.orient("bottom")
							.tickFormat(d3.format("d"));

		var yAxisUtil = d3.svg.axis()
							.scale(yScaleUtil)
							.orient("left")
							.ticks("7");

		utility.append("g")
			.attr("class", "axis")
			.attr("id", "xAxis")
			.attr("transform", "translate(0," + (height - yMargin) + ")")
			.call(xAxisUtil);

		utility.append("g")
			.attr("class", "axis")
			.attr("id", "yAxis")
			.attr("transform", "translate("+ xMargin + ","+ 0 +")")
			.call(yAxisUtil);

		utility.append("text")
		    .attr("class", "axis-label")
		    .attr("transform", "translate("+ yLabelX +","+ yLabelY +") rotate(-90)")
		    .text("Utility");

		utility.append("text")
		    .attr("class", "axis-label")
		    .attr("transform", "translate("+ xLabelX +","+ xLabelY +")")
		    .attr("dy", "-20")
		    .text("Number of Games");

		var utilGroup = d3.select('svg.utilityFn')
						.append('g')
						.attr('class', 'utilGroup');

		var line = d3.svg.line()
						.x(function(d, i){ return xScaleUtil(i+1); })
						.y(function(d){ return yScaleUtil(d); })

		var utilLine = utilGroup.append('path')
						.datum(utilData)
						.attr('class', 'utilityLine')
						.attr('d', line);
}