var width = 750, 
height = 330, 
xMargin = 60, 
yMargin = 60,
xLabelX = 360,
xLabelY = height,
yLabelX = xMargin - 35,
yLabelY = yMargin + 40,
max = 128;

function emptyCanvas(){
	d3.select('svg.payoffChart').selectAll('*').remove();
	d3.select('svg.payoffDist').selectAll('*').remove();
}

function updateCanvas(data){
	width = 750,
	xMargin = 60, 
	yMargin = 60,
	xLabelX = 360,
	xLabelY = height,
	yLabelX = xMargin - 35,
	yLabelY = yMargin + 40;
	def = 511;
	max = d3.max(data);
	if (max < def){
		height = 330;
		max = 256;
	} else {
		height = 330 + (Math.log2(max) - 8)*30;
	}

	canvas.attr("height", height);
}

function emptyUtility(){
	d3.select('svg.utilityFn').selectAll('*').remove();
}

function getFrequency(data){
	payoff_counts = {}
	countDict = {}
	for (i=0; i<data.length; i++){
		val = data[i];
		if (!(val in payoff_counts)){
			payoff_counts[val] = 0;
		}
		payoff_counts[val] += 1;
	}
	return payoff_counts;
}

function getPreFrequency(payoffs, data){
	var prevkey = d3.min(data);
	var preVal = 0;
	for (j in payoffs){
		countDict[j] = +payoffs[prevkey] + preVal;
		if (!(j == prevkey)){
			preVal = +countDict[j];
		}
		prevkey = j;
	}
	countDict[d3.min(data)] = 0;
	return countDict;
}

/*
========== draw axis for Line Chart ==========
*/
function drawAxis(num, data){
	maxPay = d3.max(data);

	xScale = d3.scaleLinear()
			.domain([0, 40])
			.range([xMargin, width]);

	yScale = d3.scaleLog()
			.domain([max, 1])
			.range([height - yMargin/2, yMargin])
			.base(2);

	canvas.append("g")
		.attr("class", "axis")
		.attr("id", "yAxis")
		.attr("transform", "translate("+ xMargin + ","+ 0 +")")
		.call(d3.axisLeft(yScale)
				.tickFormat(d3.format("$,")));

	canvas.append("text")
	    .attr("class", "axis-label")
	    .attr("transform", "translate("+ yLabelX +",20)")
	    .text("Payoff");

	canvas.select(".domain").remove();
	canvas.selectAll(".tick line").remove();
	canvas.selectAll(".tick text")
			.attr("class", "tickFormat")
			.attr("class", function(d){ return "payoff-"+d; });
}

function drawPayoff(data){
	d3.select("g.tick text.payoff-1").text("$0");

	var payoffGroup = d3.select('svg.payoffChart')
					.append('g')
					.attr('class', 'payoffGroup');

	var mean = calcMean(data);

	payoff_counts = getFrequency(data);
	dict = getPreFrequency(payoff_counts, data);

	var payoffCircle = payoffGroup.selectAll('circle')
						.data(data)
						.enter()
						.append('circle')
						.attr('cx', function(d, i) { return xScale(i - dict[d] + 1); })
						.attr('cy', function(d, i) { return yScale(d); })
						.attr('r', function(d, i){
							if (d==0){ return 0; }
							else { return 5; }
						})
						.attr('fill', '#6BB7B8')
						.on("mouseover", function(d, i){
							payoffPopup(d, i);
						})
						.on("mouseout", function(d){
							payoffGroup.selectAll(".data-label").remove();
						});

	function payoffPopup(d, i){
		if (d == 1){
			payoff = 0;
		} else {
			payoff = d
		}

		payoffGroup.append('rect')
			.attr("class", "data-label label-container")
			.attr("transform", "translate("+(xScale(i - dict[d] + 1))+","+(yScale(d) - 42)+")")
			.attr("opacity", 0.8);

		payoffGroup.append("text")
			.attr("class", "data-label")
			.attr("id", "data-amt-in")
			.attr("dy", "-21")
			.attr("transform", "translate("+ (xScale(i - dict[d] + 1) + 8) +","+ yScale(d) +")")
			.text("$"+payoff+": "+(payoff_counts[d])+" times");
	}
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
				.attr('width', width)
				.attr('height', height);

function calcMean(array){
	var sum = 0
	for (i=0; i<array.length; i++){
		sum += array[i];
	}
	return sum/array.length;
}


function calcUtility(points, wealth, cost){
	utilData = [], utilSum = [], minIdx = 0;
	utilSum.push(0)
	for (k=1; k<points; k++){
		chance = Math.pow(2, k);
		var deltaE = (Math.log(wealth + chance - cost) - Math.log(wealth))/chance;

		if (deltaE < 0){
			minIdx += 1;
		}
		utilData.push(deltaE);
		sum = utilSum[k-1] + deltaE;
		utilSum.push(sum);	
	}
	util = minPositive(utilSum);
	return utilSum;
}

function minPositive(data){
	for (k=1; k<=data.length; k++){
		if (data[k] > 0){
			return data[k]
		}
	}
	return -1;
}

function plotUtility(max, utilSum, wealth){
	utilSum.shift();

	x = d3.scaleLinear()
				.domain([1, utilSum.length])
				.range([xMargin+20, width-xMargin]);

	y = d3.scaleLinear()
					.domain([d3.min(utilSum), d3.max(utilSum)+0.02])
					.range([height - yMargin, yMargin]);

	// Define x and y Axis
	utility.append("g")
		.attr("class", "axis")
		.attr("id", "xAxis")
		.attr("transform", "translate(0," + (height - yMargin) + ")")
		.call(d3.axisBottom(x));

	utility.append("g")
		.attr("class", "axis")
		.attr("id", "yAxis")
		.attr("transform", "translate("+ (xMargin+20) + ","+ 0 +")")
		.call(d3.axisLeft(y).ticks(5));

	utility.append("text")
	    .attr("class", "axis-label")
	    .attr("transform", "translate("+ yLabelX +","+ yLabelY +") rotate(-90)")
	    .text("Utility");

	utility.append("text")
	    .attr("class", "axis-label")
	    .attr("transform", "translate("+ xLabelX +","+ xLabelY +")")
	    .attr("dy", "-20")
	    .text("Number of Heads (k)");

	var utilGroup = d3.select('svg.utilityFn')
					.append('g')
					.attr('class', 'utilGroup');

	var line = d3.line()
					.x(function(d, i){ return x(i+1); })
					.y(function(d){ return y(d); })

	var utilLine = utilGroup.append('path')
					.datum(utilSum)
					.attr('class', 'utilityLine')
					.attr('d', line);

	var maxUtil = d3.line()
					.x(function(d, i){ return x(i+1); })
					.y(y(0));

	var maxLine = utilGroup.append('path')
					.datum(utilSum)
					.attr('class', 'maxUtility')
					.attr('d', maxUtil);

					// .on("mouseover", function(d, i){
					// 	maxUtilPopup(indexOfMax);
					// })
					// .on("mouseout", function(d){
					// 	utilGroup.selectAll(".data-label").remove();
					// });
/*

	function maxUtilPopup(max){
		utilGroup.append('rect')
			.attr("class", "data-label label-container")
			.attr("transform", "translate("+ (x(minIdx/2)+8) +","+ ((height-yMargin)-42) +")")
			.attr("opacity", 0.8);

		utilGroup.append("text")
			.attr("class", "data-label")
			.attr("id", "data-amt-in")
			.attr("dy", "-21")
			.attr("transform", "translate("+ (x(minIdx/2)+16) +","+ (height-yMargin) +")")
			.text("Payoff: $"+ minIdx/2);
	}
*/
}

