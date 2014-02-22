var patients = [];
var patientNodeLocator = [];

var width = window.innerWidth - 100;
var height = 700;
var inte = 50;
var maxNuLength = 249250621;
var superLength = (width-inte)/maxNuLength;

var renderedNodes = [];
var renderedNodesLocator = [];
var availableGap = (height - 2*inte)/24;

// We keep the X-axis markers for 20 Mb range, so total markers would be 12 (240/20)

var stage = new Kinetic.Stage({
	container: 'methylationScatter-canvas',
	width: width,
	height: height // window.innerHeight - 200
});

var staticLayer = new Kinetic.Layer();
var dynamicLayer = new Kinetic.Layer();

var yAxis = new Kinetic.Line({
	points: [inte, inte, inte, height-inte],
	stroke: 'black',
	strokeWidth: 2,
	lineJoin: 'round',
	opacity: 0.1
});

var xAxis = new Kinetic.Line({
	points: [inte, height-inte, width, height-inte],
	stroke: 'black',
	strokeWidth: 2,
	lineJoin: 'round',
	opacity: 0.1
});

//draw chromosomal lines
for(var i = 0; i < 24; i++){
	var dividerHeight = height-inte-(availableGap*(2*i+1)/2);
	var divider = new Kinetic.Line({
		points: [inte, dividerHeight, width, dividerHeight],
		stroke: 'black',
		strokeWidth: 2,
		lineJoin: 'round',
		opacity: 0.1
	});
	staticLayer.add(divider);
	
	var chrName = (i == 22) ? "X" : (i == 23) ? "Y" : (i+1);
	var chrText = new Kinetic.Text({
	    x: 20,
	    y: dividerHeight-availableGap/4,
	    text: chrName,
	    fontSize: 12,
	    fontFamily: 'Calibri',
	    fill: '#000',
	    width: 20,
	    align: 'right'
	});
	staticLayer.add(chrText);
}

for(var i = 0; i < 12; i++){
	var markerLength = inte + (i+1)*20*superLength*1000000;
	
	var marker = new Kinetic.Line({
		points: [markerLength, height-inte, markerLength, height-inte+10],
		stroke: 'black',
		strokeWidth: 2,
		lineJoin: 'round',
		opacity: 0.1
	});
	staticLayer.add(marker);
	
	var markText = new Kinetic.Text({
	    x: markerLength-5,
	    y: height-inte+15,
	    text: (i+1)*20,
	    fontSize: 12,
	    fontFamily: 'Calibri',
	    fill: '#000',
	    width: 20
	});
	staticLayer.add(markText);
}

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

staticLayer.add(yAxis);
staticLayer.add(xAxis);
stage.add(staticLayer);
stage.add(dynamicLayer); 

function renderMethTracks(patient){
	console.log(patient);
/*	var patientTrack = new Kinetic.Group({
		id: patient.patient
	});*/

	for(var i = 1 ; i < 25; i++){
		var chromosomeLayer = new Kinetic.Layer({
			id: "chr" + i
		});
		stage.add(chromosomeLayer);
		
	}
	
	for(i in patient.results){
		var yPos = height-inte-(availableGap*(2*patient.results[i].chromosome-1)/2);
		var circle = new Kinetic.Circle({
	        x: inte + patient.results[i].position*superLength,
	        y: yPos,
	        radius: patient.results[i].value*10,
	        fill: patient.color,
	        stroke: 'black',
	        strokeWidth: 1,
	        opacity: 0.4
		});
		stage.get("#chr"+ patient.results[i].chromosome)[0].add(circle);
	}
	
	for(var i = 1 ; i < 25; i++){
		stage.get("#chr"+ i)[0].draw();		
	}
//	dynamicLayer.add(patientTrack);
//	dynamicLayer.draw();
}

function buildPatientList(tumorChecked, data){
	patients = [];
	patientNodeLocator = [];
	$("#patientList").multiselect("destroy");
	$("#patientList").remove();
	
	for (i in data.results.bindings) {
		var binding = data.results.bindings[i];
		var patientUri = binding["patient"].value;
		var patientCode = binding["s"].value;
		var patientCount = patients.length;
		if(patientNodeLocator[patientCode] == null) {
			var patient = {"id": patientCount, "patientCode": patientCode, "patientUri": patientUri, "tumor": tumorChecked};
			patients.push(patient);
			patientNodeLocator[patientCode] = patientCount;
		}
	}
	
	renderPatientsList();
}

function renderPatientsList(){
	var patientString = "";
	for(i in patients){
		patientString+= "<option value='"+patients[i].patientCode+"'>"+patients[i].patientCode+"</option>";
	}
	$("#methylation").append("<select id='patientList' multiple='multiple'>"+patientString+"</select>");
	$("#patientList").multiselect({
		buttonContainer: '<span class="patientButtons" />',
		buttonText: function(options) {
	        if (options.length == 0) {
	          return 'None selected <b class="caret"></b>';
	        }
	        else if (options.length > 4) {
	          return options.length + ' selected  <b class="caret"></b>';
	        }
	        else {
	          var selected = '';
	          options.each(function() {
	            selected += jQuery(this).text() + ', ';
	          });
	          return selected.substr(0, selected.length -2) + ' <b class="caret"></b>';
	        }
	    },
	    maxHeight: 200,
		onChange:function(element, checked){
			var patient = patients[patientNodeLocator[element.val()]];
			if(lookUpTable[patient.tumor].methNode != null && lookUpTable[patient.tumor].methNode != "")
				populateMethTracks(patient);			
        }
	});
}

function populateMethTracks(patient){
	$.ajax({
		url: "makeRequest.php?dataset=methData&patient="+patient.patientUri+"&endpoint="+lookUpTable[patient.tumor].methNode,
		aync: true,
		success: function (json) {
			var dataParts = json.split('<body>');
		    var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		    var results = [];
		    for(i in data.results.bindings){
		    	var binding = data.results.bindings[i];
		    	var resultUri = binding["result"].value;
		    	var pos = binding["pos"].value;
		    	var value = binding["value"].value;
		    	var chromosome = (binding["chromosome"].value == "X") ? 23 : ((binding["chromosome"].value == "Y") ? 24 : parseInt(binding["chromosome"].value));
		    	var resultNode = {"id": patient.patientCode + "_" + i, "uri": resultUri, "chromosome": chromosome, "position" : parseInt(pos), "value": value};
		    	results.push(resultNode);
		    }
		    var newPatient = {"patient": patient.patientCode, "results": results , "color": '#' + co('')};
		    renderedNodes.push(newPatient);
		    renderMethTracks(newPatient);
		}, 
		dataType: "text"
  });
}
