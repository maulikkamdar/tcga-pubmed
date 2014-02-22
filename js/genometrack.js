var width = 0.96*window.innerWidth;
var height = 660; // window.innerHeight - 320 // window.innerHeight - 200
var baseLength = 1/10000;
var trackLength = 0;
var currentHeight = 660;

var lookUpTable = [];
lookUpTable["acen"] = {"color" : "#0000ff", "opacity": 1};
lookUpTable["gneg"] = {"color" : "#ffffff", "opacity": 1};
lookUpTable["gpos25"] = {"color" : "#000000", "opacity": 0.25};
lookUpTable["gpos50"] = {"color" : "#000000", "opacity": 0.5};
lookUpTable["gpos75"] = {"color" : "#000000", "opacity": 0.75};
lookUpTable["gpos100"] = {"color" : "#000000", "opacity": 1};
lookUpTable["gvar"] = {"color": "#cccccc", "opacity": 1};

var genomeTrackCanvas = new Kinetic.Stage({
	container: 'genomeTrackCanvas',
	width: width,
	height: height, 
});


var staticTrackLayer = new Kinetic.Layer({
	width: 100
});

var dynamicTrackLayer = new Kinetic.Layer({
	width: width - 100,
	x: 100,
	draggable: true,
    dragBoundFunc: function(pos) {
    	var newX =  pos.x > 100 ? 100 : pos.x;
    	return {
    		x: newX,
        	y: this.getAbsolutePosition().y
    	}
    }
});

var currentTracks = []; // Keep an array of tracks on the interface to determine the height of the next track.

var markerGroup = new Kinetic.Group();
var linearIdeogramGroup = new Kinetic.Group();
var linearGeneGroup = new Kinetic.Group();
var circularDatasets = new Kinetic.Group();
var barDatasets = new Kinetic.Group();
var linearDatasets = new Kinetic.Group();
var dividerGroup = new Kinetic.Group();

// ------------------- Dynamic layer Static Objects
var yAxis = new Kinetic.Line({
	points: [0, 0, 0, height],
	stroke: 'black',
	strokeWidth: 2,
	lineJoin: 'round',
	opacity: 0.1
});

var geneInfoText = new Kinetic.Text({
    x: 0,
    y: 0,
    text: 'GENE - \n\nEnsembl ID: \nBiotype: \nDescription: \nSource: \nChromosome: \nStart-Stop: \nLength:',
    fontSize: 16,
    fontFamily: 'Calibri',
    fill: '#555',
    width: 300,
    padding: 10,
    opacity: 0
});

var geneInfoBox = new Kinetic.Rect({
    x: 0,
    y: 0,
    stroke: '#555',
    strokeWidth: 1,
    fill: '#ddd',
    width: 300,
    height: geneInfoText.getHeight(),
    shadowColor: 'black',
    shadowBlur: 4,
    shadowOffset: [3, 3],
    opacity: 0,
    cornerRadius: 3
});

dynamicTrackLayer.add(geneInfoBox);
dynamicTrackLayer.add(geneInfoText);
dynamicTrackLayer.add(yAxis);

//-----------------------------------------------------------
var staticLayerBg = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: 100,
    height: height,
    fill: 'white',
    stroke: '#cccccc',
    opacity: 1,
    strokeWidth: 1
});



staticTrackLayer.add(staticLayerBg);

genomeTrackCanvas.add(dynamicTrackLayer);
genomeTrackCanvas.add(staticTrackLayer);
//staticTrackLayer.setZIndex(3);

function drawGenomeTrack(chromosomeId) {
	clearTracks();
	
	var ideograms = chromosomes[chromosomeId].ideograms;
	var currentGenomeLength = chromosomes[chromosomeId].length;
	trackLength = currentGenomeLength*baseLength;
//	var baseLength = (width-100)/currentGenomeLength;
	var acenFrags = 0;
	for(i in ideograms) {
		var color = lookUpTable[ideograms[i].gieStain];
		if(color == null)
			color = {"color": "#ffffff", "opacity": 1};
		if(ideograms[i].gieStain == "acen") {
			if(acenFrags%2 == 0) {
				var point1x = ideograms[i].start*baseLength;
				var point2x = ideograms[i].stop*baseLength;
				var point3x = ideograms[i].start*baseLength;
			} else {
				var point1x = ideograms[i].stop*baseLength;
				var point2x = ideograms[i].start*baseLength;
				var point3x = ideograms[i].stop*baseLength;
			}
			var ideogramElem = new Kinetic.Polygon({
		        points: [point1x, 0, point2x, 10, point3x, 20],
		        fill: color.color,
		        stroke: 'black'
		    });
			acenFrags++;
			linearIdeogramGroup.add(ideogramElem);
		} else {
			var ideogramElem = new Kinetic.Rect({
		        x: ideograms[i].start*baseLength,
		        y: 0,
		        width: (ideograms[i].stop - ideograms[i].start)*baseLength,
		        height: 20,
		        fill: color.color,
		        stroke: 'black',
		        opacity: color.opacity,
		      //  strokeEnabled: false
		    });
			linearIdeogramGroup.add(ideogramElem);
		}
	}
	
	dynamicTrackLayer.add(linearIdeogramGroup);
	
	var baseY = 30;
	var genes = chromosomes[chromosomeId].genes;
	var geneDistance = 10;
	var currentY = baseY;
	var currentStop = -2* geneDistance;
	var currentDistance = geneDistance;
	var numberOfLayers = 0;
	
	for(i in genes){
		(function (){
			currentDistance = (genes[i].start)*baseLength - currentStop;
			if(currentDistance < geneDistance){
				currentY += 8;
				if((currentY - baseY)/8 > numberOfLayers)
					numberOfLayers++;
			} else {
				currentStop = genes[i].stop*baseLength;
				currentY = baseY;
			}
			var geneElem = new Kinetic.Rect({
		        x: genes[i].start*baseLength,
		        y: currentY,
		        width: (genes[i].stop - genes[i].start)*baseLength,
		        height: 5,
		        fill: 'blue',
		        stroke: 'black',
		        opacity: 0.6,
		        //strokeEnabled: false
		    });
			linearGeneGroup.add(geneElem);
			
			var geneText = "GENE - " + genes[i].externalName + "\n\nEnsembl ID: " + genes[i].ensemblId+ 
			"\nBiotype: Protein Coding"+"\nDescription: " + genes[i].description + "\nSource: " + genes[i].source + 
			"\nChromosome: " + chromosomeId.substring(3,chromosomeId.length)+ "\nStart-Stop: " + genes[i].start +"-"+genes[i].stop + 
			"\nLength: " + (genes[i].stop - genes[i].start);
			geneElem.on('mouseover', function() {
				geneInfoBox.setAbsolutePosition(this.getAbsolutePosition().x, this.getAbsolutePosition().y+8);
				geneInfoBox.setOpacity(1);
				geneInfoBox.setZIndex(4);			
				geneInfoText.setText(geneText);
				geneInfoText.setAbsolutePosition(this.getAbsolutePosition().x, this.getAbsolutePosition().y+8);
				geneInfoText.setOpacity(1);
				geneInfoText.setZIndex(4);
				geneInfoBox.setHeight(geneInfoText.getHeight());
				dynamicTrackLayer.draw(); 
	        });
			
			geneElem.on('mouseout', function() {
				geneInfoBox.setAbsolutePosition(0,0);
				geneInfoBox.setOpacity(0);
				
				geneInfoText.setAbsolutePosition(0,0);
				geneInfoText.setOpacity(0);
				dynamicTrackLayer.draw(); 
	        });
		}());
		
	}
	dynamicTrackLayer.add(linearGeneGroup);
	
	getDivider(baseY - 5, trackLength);
	getDivider(baseY + (numberOfLayers +1)*8, trackLength);
	dynamicTrackLayer.add(dividerGroup);
	
	var totalMarkerCount = Math.floor(currentGenomeLength/1000000);
	var markerCount = 1;
	while(markerCount < (totalMarkerCount + 1) ){
		if(markerCount%5 == 0)
			markerHeight = 15;
		else
			markerHeight = 8;
		var markerX = markerCount*1000000*baseLength;
		var marker = new Kinetic.Line({
			points: [markerX, height - 30, markerX, height - 30 +markerHeight],
			stroke: 'black',
			strokeWidth: 2,
			lineJoin: 'round',
			opacity: 0.4
		});
		markerGroup.add(marker);
		if(markerCount%5 == 0){
			var markerText = new Kinetic.Text({
		        x: markerX - 3,
		        y: height - 30 + markerHeight,
		        text: markerCount,
		        fontSize: 10,
		        fontFamily: 'Calibri',
		        fill: 'green'
		     });
			markerGroup.add(markerText);
		}
		markerCount++;
	}
	
	dynamicTrackLayer.add(markerGroup);
	dynamicTrackLayer.draw();
}

function clearTracks() {
	linearIdeogramGroup.destroy();
	linearGeneGroup.destroy();
	markerGroup.destroy();
//	circularDatasets.destroy();
//	linearDatasets.destroy();
//	barDatasets.destroy();
	dividerGroup.destroy();
}

function getDivider(height, trackLength) {
	var divider = new Kinetic.Line({
		  points: [0, height, trackLength, height],
		  stroke: 'black',
		  strokeWidth: 2,
		  lineJoin: 'round',
		  opacity: 0.1
		});
	dividerGroup.add(divider);
}

// ------------------------------------ Dataset Plotting Functions --------------------------------
function plotCircularData(data, chromosomeId){
	circularDatasets.destroy();
	var currentGenomeLength = chromosomes[chromosomeId].length;
	
	var height = 150 + 20*(currentTracks.length-1);
	for(i in currentTracks){
		height += currentTracks[i].height;
	}
//	var baseLength = (width-100)/currentGenomeLength;
	for(i in data) {
		var posX = parseInt(data[i].position)*baseLength;
		var rad = data[i].normalizedValue/2;
		var circle = new Kinetic.Circle({
	        x: posX,
	        y: height-rad,
	        radius: rad,
	        fill: 'red',
	        stroke: 'red',
	        strokeWidth: 1,
	        opacity: 0.4
		});
		circularDatasets.add(circle);
	}
	dynamicTrackLayer.add(circularDatasets);
	
	getDivider(height, currentGenomeLength*baseLength);
	
	dynamicTrackLayer.draw();
}

function plotLinearData(data, chromosomeId){
//	linearDatasets.destroy();
	var currentGenomeLength = chromosomes[chromosomeId].length;
	var height = 150 + 20*(currentTracks.length-1);
	var trackName = "";
	for(i in currentTracks){
		height += currentTracks[i].height;
		if(i == currentTracks.length-1) {
			var trackIds = currentTracks[i].name.split('_');
			if(trackIds.length > 0)
				trackName = trackIds[0]+"\n"+ cancerCodeList[trackIds[1]].name +"\n"+(trackIds[2] == "meth"? "Methylation": "Exon Expression");
			else
				trackName = trackIds[0];
		}
	}
	var points= [];
	var counter = 0;
//	var baseLength = (width-100)/currentGenomeLength;
	var point = {"x": counter, "y": height};
	points.push(point);
	
	for(i in data) {
		var posX = parseInt(data[i].position)*baseLength;
		var rad = data[i].normalizedValue;
		
		var point1 = {"x": posX, "y": height};
		var point2 = {"x": posX, "y": height-rad};
		var point3 = {"x": posX, "y": height};
		counter = posX;
		
		points.push(point1);
		points.push(point2);
		points.push(point3);
	}
	
	var line = new Kinetic.Line({
		points: points,
		stroke: 'red',
		strokeWidth: 1,
		lineJoin: 'round',
		opacity: 1
    });
	
	var trackText = new Kinetic.Text({
	    x: 0,
	    y: height-50,
	    text: trackName,
	    fontSize: 9,
	    fontFamily: 'Calibri',
	    width: 100,
	    padding: 10,
	    fill: '#000',
	    opacity: 1
	});
	
	if(height > currentHeight) {
		genomeTrackCanvas.setHeight(height+100);
		currentHeight = height+100;
		staticLayerBg.setHeight(currentHeight);
	}
	
	staticTrackLayer.add(trackText);
	dynamicTrackLayer.add(line);
	
	getDivider(height, currentGenomeLength*baseLength);
	
	staticTrackLayer.draw();
	dynamicTrackLayer.draw();
}

function plotBarData(data, chromosomeId){
//	barDatasets.destroy();
	var currentGenomeLength = chromosomes[chromosomeId].length;
	var height = 150 + 20*(currentTracks.length-1);
	var trackName = "";
	for(i in currentTracks){
		height += currentTracks[i].height;
		if(i == currentTracks.length-1) {
			var trackIds = currentTracks[i].name.split('_');
			if(trackIds.length > 0)
				trackName = trackIds[0]+"\n"+ cancerCodeList[trackIds[1]].name +"\n"+(trackIds[2] == "meth"? "Methylation": "Exon Expression");
			else
				trackName = trackIds[0];
		}
	}
	
	var points= [];
	var counter = 0;
//	var baseLength = (width-100)/currentGenomeLength;
	var point = {"x": counter, "y": height};
	points.push(point);
	
	for(i in data) {
		var startX = parseInt(data[i].start)*baseLength;
		var stopX = parseInt(data[i].stop)*baseLength;
		var rad = data[i].normalizedValue;
		
		var point1 = {"x": startX, "y": height};
		var point2 = {"x": startX, "y": height-rad};
		var point3 = {"x": stopX, "y": height-rad};
		var point4 = {"x": stopX, "y": height};
		
		points.push(point1);
		points.push(point2);
		points.push(point3);
		points.push(point4);
	}
	
	var poly = new Kinetic.Line({
        points: points,
        fill: 'green',
        stroke: 'green',
        strokeWidth: 1,
        opacity: 0.4,
        closed: true
      });
	
	var trackText = new Kinetic.Text({
	    x: 0,
	    y: height-50,
	    text: trackName,
	    fontSize: 9,
	    fontFamily: 'Calibri',
	    width: 100,
	    padding: 10,
	    fill: '#000',
	    opacity: 1
	});
	
	if(height > currentHeight) {
		genomeTrackCanvas.setHeight(height+100);
		currentHeight = height+100;
		staticLayerBg.setHeight(currentHeight);
	}
		
	staticTrackLayer.add(trackText);
	dynamicTrackLayer.add(poly);
	
	getDivider(height, currentGenomeLength*baseLength);

	staticTrackLayer.draw();
	dynamicTrackLayer.draw();
}

//--------------------------------------------------------------------------------

function populateTracks(){
	var chromosomalData = [];
	console.log(chromosomes);
	for(i in chromosomes) {
		var chromosomeTag = {"id": i, "name": "Chromosome " + i.substring(3, i.length)};
		chromosomalData.push(chromosomeTag);
	}
	d3.select("#chromosomeIds").selectAll("option").data(chromosomalData)
		.enter().append("option").text(function(d) {return d.name; }).attr("value", function(d){ return d.id;});
	drawGenomeTrack(chromosomalData[0].id);
	
	jQuery('#chromosomeIds').multiselect({
		onChange:function(element, checked){
			drawGenomeTrack(element.val());
		}
	});
}

var populateTracksTrigger = setInterval(function(){
	if(genomeParsed == true) {
		populateTracks();
		jQuery(".splashScreenExplorer").hide();
		clearInterval(populateTracksTrigger);
	}
}, 10);

//-------------------------- Interface Elements Callback
var playTrackCounter = null;

jQuery('#trackSlider').slider({
	'tooltip': 'hide',
	'value' : 1
}).on('slide', function(ev){
    baseLength = baseLength*ev.value;
    dynamicTrackLayer.draw();
});

jQuery('#play').click(function() {
	playTrackCounter = setInterval(function(){
		var playWidth = dynamicTrackLayer.getAbsolutePosition().x-dynamicTrackLayer.getWidth()/10;
		dynamicTrackLayer.setAbsolutePosition(playWidth, dynamicTrackLayer.getAbsolutePosition().y);
		dynamicTrackLayer.draw();
		if(playWidth-dynamicTrackLayer.getWidth() < -trackLength) {
			clearInterval(playTrackCounter);
		}
	}, 1000);
});

jQuery('#stop').click(function() {
	clearInterval(playTrackCounter);
	dynamicTrackLayer.setAbsolutePosition(100, dynamicTrackLayer.getAbsolutePosition().y);
	dynamicTrackLayer.draw();
})

jQuery('#front').click(function() {
	var playWidth = dynamicTrackLayer.getAbsolutePosition().x-dynamicTrackLayer.getWidth();
	if(playWidth > -trackLength) {
		dynamicTrackLayer.setAbsolutePosition(playWidth, dynamicTrackLayer.getAbsolutePosition().y);
		dynamicTrackLayer.draw();
	}
});

jQuery('#back').click(function() {
	var playWidth = dynamicTrackLayer.getAbsolutePosition().x+dynamicTrackLayer.getWidth();
	if(playWidth-dynamicTrackLayer.getWidth() < 0){
		dynamicTrackLayer.setAbsolutePosition(playWidth, dynamicTrackLayer.getAbsolutePosition().y);
		dynamicTrackLayer.draw();
	}
});

jQuery('#zoomIn').click(function() {
	baseLength *= 2;
	dynamicTrackLayer.draw();
});