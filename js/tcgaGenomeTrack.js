var cancerCodeList = [];
var cancerCodes;
var patients = [];
var patientNodeLocator = [];
var patientSelector = {"meth": false, "exon": false};

d3.json("data/tcgaCancerGraphs.json", function(cancerCodesData) {
	cancerCodes = cancerCodesData;
	console.log(cancerCodesData);
	for(i in cancerCodesData) {
		cancerCodeList[cancerCodes[i].id] = {"name": cancerCodesData[i].name, "methNode" : cancerCodesData[i].methNode, "exonNode" : cancerCodesData[i].exonNode, "patients": []};
	}
	d3.select("#cancerTypes").selectAll("option").data(cancerCodes).enter().append("option").text(function(d) {return d.name; }).attr("value", function(d){ return d.id;});
	retrievePatientList(cancerCodes[0].id, false);
	jQuery('#cancerTypes').multiselect({
		onChange:function(element, checked){
			var tumorChecked = element.val();
			retrievePatientList(tumorChecked, true);
        }
	});
});

function retrievePatientList(tumorChecked, counter) {
	patients = [];
	patientNodeLocator = [];
	patientSelector.meth = false;
	patientSelector.exon = false;
	jQuery("#patientList").multiselect("destroy");
	jQuery("select#patientList").remove();
	
	if(cancerCodeList[tumorChecked].methNode != "" && cancerCodeList[tumorChecked].methNode != null) {
		d3.text("makeRequest.php?dataset=patientList&graph="+ tumorChecked + "&endpoint=" + cancerCodeList[tumorChecked].methNode, function(data){
			populatePatients(tumorChecked,data,"meth");
		});
	} else
		patientSelector.meth = true;
	if(cancerCodeList[tumorChecked].exonNode != "" && cancerCodeList[tumorChecked].exonNode != null) {
		d3.text("makeRequest.php?dataset=patientList&graph="+ tumorChecked + "&endpoint=" + cancerCodeList[tumorChecked].exonNode, function(data){
			populatePatients(tumorChecked,data,"exon");
       	});
	} else
		patientSelector.exon = true;
	var myInterval = setInterval(function(){
		if(patientSelector.meth && patientSelector.exon) {	
		//	console.log(patients);
			d3.select("#genomeBar").append("select").attr("id", "patientList").attr("multiple", "multiple").selectAll("option").data(patients).enter().append("option").text(function(d) {return d.patientCode; }).attr("value", function(d){ return d.patientCode;});
			jQuery("#patientList").multiselect({
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
					var chromosome = jQuery("#chromosomeIds").val();
					for(i in patient.types){
						console.log(patient.types[i]);
						if(patient.types[i] == "meth")
							populateMethTracks(patient,chromosome);
						else
							populateExonTracks(patient,chromosome);
					}
					
		        }
			});
			clearInterval(myInterval);
		}
	}, 10);
}

function populateMethTracks(patient, chromosome) {
	d3.text("makeRequest.php?dataset=methData&chromosomeNo="+chromosome.substring(3,chromosome.length)+"&patientNo="+patient.patientUri+"&graph="+ patient.tumor + "&endpoint=" + cancerCodeList[patient.tumor].methNode, function(json){
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		var circularData = [];
		var maximum = 0, minimum = 1;
		for(i in data.results.bindings){
			var binding = data.results.bindings[i];
			var dataPoint = {"result": binding["result"].value, "position": binding["pos"].value, "value": binding["value"].value, "normalizedValue": 1};
			if(binding["value"].value > maximum)
				maximum = binding["value"].value;
			if(binding["value"].value < minimum)
				minimum = binding["value"].value;
			circularData.push(dataPoint);
		}
		var currentTrack = {"name": patient.patientCode+"_"+patient.tumor+"_meth", "height": 50};
		currentTracks.push(currentTrack);
		plotLinearData(normalizeData(circularData, maximum, minimum, 50, 1), chromosome);	
	});
}

function populateExonTracks(patient, chromosome) {
	d3.text("makeRequest.php?dataset=exonData&chromosomeNo="+chromosome.substring(3,chromosome.length)+"&patientNo="+patient.patientUri+"&graph="+ patient.tumor + "&endpoint=" + cancerCodeList[patient.tumor].exonNode, function(json){
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		var barData = [];
		var maximum = 0, minimum = 1000;
		for(i in data.results.bindings){
			var binding = data.results.bindings[i];
			var value = parseInt(binding["value"].value);
			var dataPoint = {"result": binding["result"].value, "start": binding["start"].value, "stop": binding["stop"].value, "value": binding["value"].value, "normalizedValue": 1};
			if(value > maximum)
				maximum = value;
			if(value < minimum)
				minimum = value;
			barData.push(dataPoint);
		}
		var currentTrack = {"name": patient.patientCode+"_"+patient.tumor+"_exon", "height": 100};
		currentTracks.push(currentTrack);
		plotBarData(normalizeData(barData, maximum, minimum, 100, 1), chromosome);	
	});
}

function populatePatients(tumorChecked, json, type){
	var dataParts = json.split('<body>');
	var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
	for (i in data.results.bindings) {
	   var binding = data.results.bindings[i];
	   var patientUri = binding["patient"].value;
	   var patientCode = binding["s"].value;
	   var patientCount = patients.length;
	   if(patientNodeLocator[patientCode] == null) {
		   var patient = {"id": patientCount, "patientCode": patientCode, "patientUri": patientUri, "tumor": tumorChecked, "types": []};
		   patient.types.push(type);
		   patients.push(patient);
		   cancerCodeList[tumorChecked].patients.push(patient);
		   patientNodeLocator[patientCode] = patientCount;
	   } else {
		   patients[patientNodeLocator[patientCode]].types.push(type);
	   }
	}
	patientSelector[type] = true;
}