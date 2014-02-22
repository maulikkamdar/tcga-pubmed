var chromosomes = [];
var genomeLength = 0;
var totalChromosomes = 0;
var totalGenes = 0;
var genomeParsed = false;

//jQuery(".splashScreenExplorer").hide();

d3.tsv('data/hgTables.txt', function (data){
	var currentChromosomeLength = 0;
	for(i in data) {
		var ideStart = parseInt(data[i].chromStart);
		var ideEnd = parseInt(data[i].chromEnd);
		var newIdeogram = {"start" : ideStart, "stop" : ideEnd, "name": data[i].name, "gieStain": data[i].gieStain};
		if(chromosomes[data[i].chrom] == null) {
			genomeLength += currentChromosomeLength;
			var newChromosome = {"ideograms" : [], "genes" : [], "length": ideEnd};
			newChromosome.ideograms.push(newIdeogram);
			chromosomes[data[i].chrom] = newChromosome;
			currentChromosomeLength = ideEnd;
			totalChromosomes++;
		} else {
			chromosomes[data[i].chrom].ideograms.push(newIdeogram);
			chromosomes[data[i].chrom].length = ideEnd;
			currentChromosomeLength = ideEnd;
		}
	}
	genomeLength += currentChromosomeLength;   //EOF exception
	getAllGenes("hsa");
});

function getAllGenes(species) {
	//var geneList = "http://ws.bioinfo.cipf.es/cellbase/rest/latest/" + species + "/feature/gene/list?biotype=protein_coding"; //CellBase GeneList
	var geneList = "data/list.txt";
	d3.tsv(geneList, function (data){
		totalGenes = data.length;
		for(i in data) {
			var chromosomeId = "chr" + data[i].chromosome;
			var geneStart = parseInt(data[i].start);
			var geneEnd = parseInt(data[i].end);
			var gene = {"start": geneStart, "stop": geneEnd, "ensemblId": data[i]['#Ensembl gene'], "description": data[i].description, "externalName": data[i]['external name'], "externalNameSrc": data[i]['external name source'], "source": data[i].source};
			if(chromosomes[chromosomeId] != null) {
				chromosomes[chromosomeId].genes.push(gene);
			}
		}
		for(i in chromosomes){
			chromosomes[i].genes.sort(function(a,b){return parseFloat(a.start - b.start);})
		}
		console.log(chromosomes);
		genomeParsed = true;
	});
}
