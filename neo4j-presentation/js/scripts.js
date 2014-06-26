$(window).resize(function() {
    console.log('resize');
});


var requests = new Array();

var data_languages = {
	"en" : {},
	"es" : {},
	"cat" : {},
	"other" : {}
};

function get_tuits_per_language() {
     var text = "MATCH (User) \
	RETURN User.lang, count(User.lang) \
	ORDER BY count(User.lang) DESC;"
	return text;
}

function get_language_td(lang) {
    var text = "MATCH (User)<-[:twitted_by]-(Twit)-[a:appears]->(Word) \
    WHERE Word.is_tradermark = true AND User.lang = "+ lang + "WITH Word, count(DISTINCT User) AS users \
    RETURN Word, users ORDER BY users DESC \
    LIMIT 25";
	if(lang = "other") {
		text = "MATCH (User)<-[:twitted_by]-(Twit)-[a:appears]->(Word) \
		    WHERE Word.is_tradermark = true AND NOT User.lang IN ['es', 'en', 'ca'] \
		    WITH Word, count(DISTINCT User) AS users \
		    RETURN Word, users ORDER BY users DESC \
		    LIMIT 25";
	}
	return text;
}

function make_graph(language_data, total_tuits, languages, id){
				//pillo colors pel chart
                var colors_tmp = Highcharts.getOptions().colors;
                var data_chart = new Array();
                var index_color = 0;
				var languages_index = new Array();
				var percentatge_total = 0;
                for(language in language_data)
				{
					//Arrays de noms de llenguatges
					languages_index.push(language);
					var object = {};
					//% de llenguatge, total_size == # de tuits en llenguatge X i total_tuits #total de tuits
					object.y = parseFloat(language_data[language].total_size / parseFloat(total_tuits));
					console.log("IDIOMA i N",language ,language_data[language].total_size, language_data[language].total_size/total_tuits);
					for (var i = 0; i < language_data[language].data.length; i++) {
						/*
							Aquí es on es fa proporcional, total_size es el total de tuits en el llenguatge i total_tuits es TOTS els tuits.
						*/
						console.log('mmm', language_data[language].data[i])
						language_data[language].data[i] = ((language_data[language].data[i] * language_data[language].total_size/total_tuits));
						percentatge_total += language_data[language].data[i];
					};
					object.color = colors_tmp[index_color];
					/*
						language_data[language].categories == Nom de les marques
						language_data[language].data percentatge dels tuits de la marca i previament ponderat amb el numero total de tuits linia 47
					*/
					object.drilldown= {
						"name" : 'Twits',
						"categories" : language_data[language].categories,
						"data" : language_data[language].data,
						"color": colors_tmp[0]
					}
					data_chart.push(object);
					index_color++;

				}
				console.log("PERCENTATGE_TOTAL", percentatge_total);
				var colors = Highcharts.getOptions().colors,
		            categories = languages,
		            name = 'Language Tweets',
		            data = data_chart;

				console.log("DATA_CHART", data_chart);
		        // Build the data arrays
		        var tuitsData = [];
		        var PerLanguageData = [];
		        for (var i = 0; i < data_chart.length; i++) {
		    		console.log(data_chart[i].y);
		            // add browser data
		            tuitsData.push({
		                name: languages_index[i],
		                y: data_chart[i].y,
		                color: data_chart[i].color
		            });

		            // add version data
		            for (var j = 0; j < data_chart[i].drilldown.data.length; j++) {
		                var brightness = 0.2 - (j / data_chart[i].drilldown.data.length) / 5 ;
		                PerLanguageData.push({
		                    name: data_chart[i].drilldown.categories[j],
		                    y: data_chart[i].drilldown.data[j],
		                    color: Highcharts.Color(data_chart[i].color).brighten(brightness).get()
		                });
		            }
		         }
		            // Create the chart
		        $('#chart-'+id).highcharts({
		            chart: {
		                type: 'pie'
		                // backgroundColor:'rgba(255, 255, 255, 0.1)'
		            },
		            title: {
		                text: 'Language Tweets MWC\'13'
		            },
		            yAxis: {
		                title: {
		                    text: 'Total percentage of language of tweets MWC'
		                }
		            },
		            plotOptions: {
		                pie: {
		                    shadow: false,
		                    center: ['50%', '50%']
		                }
		            },
		            tooltip: {
		                valueSuffix: '%'
		            },
		            series: [{
		                name: 'Languages',
		                data: tuitsData,
		                size: '60%',
		                dataLabels: {
		                    formatter: function() {
		                        return this.y > 5 ? this.point.name : null;
		                    },
		                    color: 'white',
		                    distance: -30
		                }
		            }, {
		                name: 'Trademarks',
		                data: PerLanguageData,
		                size: '80%',
		                innerSize: '60%',
		                dataLabels: {
		                    formatter: function() {
		                        // display only if larger than 1
		                        return this.y > 1 ? '<b>'+ this.point.name +':</b> '+ this.y +'%'  : null;
		                    }
		                }
		            }]
		        });
            	Reveal.removeEventListener('perform-query-'+ id, functions[id], false);
	            Reveal.up();
            	Reveal.down();
	        	Reveal.addEventListener('perform-query-'+ id, functions[id]);

}


var A = get_language_td('other');
var B = get_language_td('en');
var C = get_language_td('es');
var D = get_language_td('cat');
var E = get_tuits_per_language();

function abort_requests(){
	$('#feedback').remove();
	for (var i = 0; i < requests.length; i++) {
		requests[i].abort();
	};
}


function perform_language_query(id){
	abort_requests();
	requests = [];
	var languages_num_tuits;
	$("#chart-"+id).prepend('<p id="feedback"><small>Querying database backend <span id="dancing-dots-text"> <span><span>.</span><span>.</span><span>.</span></span></span></small></p>');

	var
        aj1 = $.post( "http://graph.calmisko.org/db/data/cypher", { query: A}, function(data) {
  			console.log( "success" );
  			data_languages['other'] = data.data;
		}),
        aj2 = $.post( "http://graph.calmisko.org/db/data/cypher", { query: B}, function(data) {
  			console.log( "success" );
  			data_languages['en'] = data.data
		}),
        aj3 = $.post( "http://graph.calmisko.org/db/data/cypher", { query: C}, function(data) {
  			console.log( "success" );
  			data_languages['es'] = data.data;
		}),
        aj4 = $.post( "http://graph.calmisko.org/db/data/cypher", { query: D}, function(data) {
  			console.log( "success" );
  			data_languages['cat'] = data.data;
		});

        aj5 = $.post( "http://graph.calmisko.org/db/data/cypher", { query: E}, function(data) {
  			console.log( "success" );
  			languages_num_tuits = data.data;
		});
        requests.push(aj1, aj2, aj3, aj4, aj5);

        $.when(aj1,aj2,aj3,aj4, aj5).done(function(a,b,c,d, e){
            var languages = new Array();
            var language_data = {
            	"en" : {},
            	"cat" : {},
            	"es" : {},
            	"other" : {}
            };
            var total_tuits =  0;
            for(language in data_languages)
			{
			   object_lang = data_languages[language] ;
			   languages.push(language);
			   language_data[language].categories = new Array();
			   language_data[language].data = new Array();
			   language_data[language].n_tuits = 0;
			   language_data[language].total_size = 0;

			   for (var i = 0; i < data_languages[language].length; i++) {
			   		language_data[language].n_tuits = data_languages[language].length;
			  		language_data[language].categories.push(data_languages[language][i][0].data.value)
			  		language_data[language].data.push(parseFloat(data_languages[language][i][1]));
			  		//language_data[language].total_size += parseFloat(data_languages[language][i][1]);
			   };
			}
			//# de tuits per llenguatge
			for (var i = 0; i < languages_num_tuits.length; i++) {
				if(languages_num_tuits[i][0] == "en") language_data["en"].total_size = languages_num_tuits[i][1];
				if(languages_num_tuits[i][0] == "es") language_data["es"].total_size = languages_num_tuits[i][1];
				if(languages_num_tuits[i][0] == "ca") language_data["cat"].total_size = languages_num_tuits[i][1];
				if(languages_num_tuits[i][0] != "en" && languages_num_tuits[i][0] != "es" && languages_num_tuits[i][0] != "ca" ) language_data["other"].total_size += languages_num_tuits[i][1];
				total_tuits += languages_num_tuits[i][1];
			};

			make_graph(language_data, total_tuits, languages, id);
			requests = [];
	        });
};


function visualize_query(id) {
	abort_requests();
	requests = [];
	if(id == 8){
		id = 7;
    	var text = "MATCH (Word)<-[:appears]-(Tweet)-[:appears]->(Word2) \
    		WHERE Word2.classification = \"negative\" AND Word.is_tradermark = true \
    		RETURN Word.value AS name, count(Tweet) AS size \
    		ORDER BY count(Tweet) DESC \
    		LIMIT 20";
    	console.log(text);
    	id = "7-2";
    }else if(id == 7){
    	var text = $("#query-"+id).text();
    	id = "7-1";
	}else{
    	var text = $("#query-"+id).text();
   	}
   	$("#chart-"+id).prepend('<p id="feedback" ><small>Querying database backend <span id="dancing-dots-text"> <span><span>.</span><span>.</span><span>.</span></span></span></small></p>');
	var req = $.post( "http://graph.calmisko.org/db/data/cypher", { query: text}, function() {
	  console.log( "success" );
	})
	  .done(function(data) {
	    console.log( "Dades" + data.data + "ciao");
	    console.log(data.data.length);
		    if (id == 1 || id == 2 || id == 3 || id == 4){//code for bubbles chart
			    $.getScript('http://d3js.org/d3.v3.min.js', function(){
		    	var objJson={};
			    var str={};
			    str.name="flare"
			    str.children=new Array();
			    str.children[0]=new Object();
			    str.children[0].name="data"
			    str.children[0].children=new Array();
			    for(var i=0; i < data.data.length; i++) {
				    	str.children[0].children[i]={};
				    	if (data.data[i][0].data.name != undefined) {
				    		//for query 4
				    		str.children[0].children[i].name=data.data[i][0].data.name;
				    	}
				    	else if (data.data[i][0].data.value != undefined){
				    		//for query 1
				    		str.children[0].children[i].name=data.data[i][0].data.value;
				    	}
				    	else {
				    		str.children[0].children[i].name="empty";
				    	}
				    	str.children[0].children[i].size=data.data[i][1];




				    }
				    objJson=JSON.stringify(str);
				    console.log(objJson);

			    var diameter = 960,
		        format = d3.format(",d"),
		        color = d3.scale.category20c();

			    var bubble = d3.layout.pack()
			        .sort(null)
			        .size([diameter, diameter])
			        .padding(1.5);

			    $("#chart-" +id).empty();
			    var svg = d3.select("#chart-" +id).append("svg")
			        .attr("width", diameter)
			        .attr("height", diameter)
			        .attr("class", "bubble");

			    root=JSON.parse(objJson);
			      var node = svg.selectAll(".node")
			          .data(bubble.nodes(classes(root))
			          .filter(function(d) { return !d.children; }))
			        .enter().append("g")
			          .attr("class", "node")
			          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			          .attr("stroke", "black")
			        .append("g")
			        .attr("class", "cell child")
			        .on("mouseover", mOver)
			        .on("mouseout", function() {
	                   d3.select(this)
				           .transition()
				           .duration(300)
				           .style('stroke-width', 1)
					       .style('stroke', 'black');
   					});

			        function mOver(d) {
					    d3.select(this)
					        .transition()
					        .duration(300)
					        .style('stroke-width', 6)
					        .style('stroke', 'yellow');
					}

			      node.append("title")
			          .text(function(d) { return d.className + ": " + format(d.value); });

			       node.on("click", function(d) {
        				alert(d.className);
    				});


			      node.append("circle")
			          .attr("r", function(d) { return d.r; })
			          .style("fill", function(d) {
			        	  var number1 = Math.floor(Math.random() * 255);
			        	  var number2 = Math.floor(Math.random() * 255);
			        	  var number3 = Math.floor(Math.random() * 255);
			        	  return d3.rgb(number1,number2,number3); });

			      node.append("text")
			          .attr("dy", ".3em")
			          .style("text-anchor", "middle")
			          .text(function(d) { return d.className.substring(0, d.r / 3); });

			    // Returns a flattened hierarchy containing all leaf nodes under the root.
			    function classes(root) {
			      var classes = [];

			      function recurse(name, node) {
			        if (node.children)
			        	node.children.forEach(function(child) { recurse(node.name, child); });
			        else
			        	classes.push({packageName: name, className: node.name, value: node.size});
			      }

			      recurse(null, root);
                	Reveal.removeEventListener('perform-query-'+ id, functions[id], false);
		            Reveal.up();
	            	Reveal.down();
    	        	Reveal.addEventListener('perform-query-'+ id, functions[id]);

			      return {children: classes};
			    }

			    d3.select(self.frameElement).style("height", diameter + "px");
			    })
		    }
		    else if (id == "7-1" || id == "7-2"){//code for histogram chart
		    	console.log("HISTOGRAMA????");
		    	$.getScript('http://d3js.org/d3.v3.min.js', function(){

		 		    var result=[];
		    		for(var i=0; i < data.data.length; i++){
		    			 result[i]={}
		    			 result[i].letter=data.data[i][0];
		    			 result[i].frequency=data.data[i][1];
		    		 }

		 		    console.log(result);
		    		 var margin = {top: 20, right: 20, bottom: 30, left: 100},
		    		    width = 960 - margin.left - margin.right,
		    		    height = 500 - margin.top - margin.bottom;

		    		var x = d3.scale.ordinal()
		    		    .rangeRoundBands([0, width], .1);

		    		var y = d3.scale.linear()
		    		    .range([height, 0]);

		    		var xAxis = d3.svg.axis()
		    		    .scale(x)
		    		    .orient("bottom");

		    		var yAxis = d3.svg.axis()
		    		    .scale(y)
		    		    .orient("left");
		    		$("#chart-" +id).empty();
				    var svg = d3.select("#chart-" +id).append("svg")
		    		    .attr("width", width + margin.left + margin.right)
		    		    .attr("height", height + margin.top + margin.bottom+100)
		    		  .append("g")
		    		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    		data=result;
		    		//random sort
		    		data.sort(function(a, b){
		    			return (Math.floor((Math.random() * 10)%3)-1);
		    		});
		    		  x.domain(data.map(function(d) { return d.letter; }));
		    		  y.domain([0, d3.max(data, function(d) { return (d.frequency+parseInt(d.frequency/10)); })]);

		    		  svg.append("g")
		    		      .attr("class", "x axis")
		    		      .attr("transform", "translate(0," + height + ")")
		    		      .call(xAxis)
		    		      .append("text")
		    		      .attr("dx", ".71em")
		    		      .attr("x", width/2)
		    		      .attr("y", 30)
		    		      .style("text-anchor", "end")
		    		      .text("Company");

		    		  //find if are positive or negative comments to write the label
		    		  var n=text.search("positive");
		    		  var type="";
		    		  if (n>0) type="positive";
		    		  else type="negative";

		    		  svg.append("g")
		    		      .attr("class", "y axis")
		    		      .call(yAxis)
		    		    .append("text")
		    		      .attr("y", -40)
		    		      .attr("transform", "rotate(-90)")
		    		      .attr("dy", ".71em")
		    		      .style("text-anchor", "end")
		    		      .text("N? of "+ type +" comments");

		    		  svg.selectAll(".bar")
		    		      .data(data)
		    		    .enter().append("rect")
		    		      .attr("class", "bar")
		    		      .attr("x", function(d) { return x(d.letter)+x.rangeBand()*0.05; })
		    		      .attr("width", x.rangeBand()*0.9)
		    		      .attr("y", function(d) { return y(d.frequency); })
		    		      .attr("height", function(d) { return height - y(d.frequency); })


			        var id_func;
					if (id == '7-1') {id_func='7'}else {id_func = '8'};
					Reveal.removeEventListener('perform-query-'+ id, functions[id_func], false);
			        Reveal.up();
			    	Reveal.down();
			    	Reveal.addEventListener('perform-query-'+ id, functions[id_func]);

			    	function type(d) {
		    		  d.frequency = +d.frequency;
		    		  return d;
		    		}



		    	})
		    	}
		    else if(id == 6){
				var objJson={};
			    var str=new Array();
			    var map=new Array();
			    var idx=0;//create the json data like "readme-flare-imports.json"
			    for(var i=0; i < data.data.length; i++) {

			    	if (map[data.data[i][0]]==undefined)
				    	{map[data.data[i][0]]=idx;
				    	idx++;
				    	var idx_t=map[data.data[i][0]];
				    	str[idx_t]={};
				    	str[idx_t].name="class."+data.data[i][0];
				    	str[idx_t].size=data.data[i][2];
					    str[idx_t].imports=new Array();
					    str[idx_t].imports[0]="class."+data.data[i][1];}
				    else
				    	{var idx_t=map[data.data[i][0]];
				    	str[idx_t].size+=data.data[i][2];
				    	var x=-1;
				    	for (j=0;j<str[idx_t].imports.length;j++){
				    		if ((str[idx_t].imports[j])==("class."+data.data[i][1])) 	x=1;
				    		}
				    	if (x==-1)
				    		str[idx_t].imports[str[idx_t].imports.length]="class."+data.data[i][1];
				    	}
			    if (map[data.data[i][1]]==undefined)
			    	{map[data.data[i][1]]=idx;
			    	idx++;
			    	var idx_t=map[data.data[i][1]];
			    	str[idx_t]={};
			    	str[idx_t].name="class."+data.data[i][1];
			    	str[idx_t].size=data.data[i][2];
				    str[idx_t].imports=new Array();
				    str[idx_t].imports[0]="class."+data.data[i][0];}
			    else
			    	{var idx_t=map[data.data[i][1]];
			    	str[idx_t].size+=data.data[i][2];
			    	var x=-1;
			    	for (j=0;j<str[idx_t].imports.length;j++){
			    		if ((str[idx_t].imports[j])==("class."+data.data[i][0])) 	x=1;
			    		}
			    	if (x==-1)
			    		str[idx_t].imports[str[idx_t].imports.length]="class."+data.data[i][0];
			    	}


			    }
			    objJson=JSON.stringify(str);

			    var diameter = 960,
		        radius = diameter / 2,
		        innerRadius = radius - 120;

			    var cluster = d3.layout.cluster()
			        .size([360, innerRadius])
			        .sort(null)
			        .value(function(d) { return d.size; });

			    var bundle = d3.layout.bundle();

			    var line = d3.svg.line.radial()
			        .interpolate("bundle")
			        .tension(.85)
			        .radius(function(d) { return d.y; })
			        .angle(function(d) { return d.x / 180 * Math.PI; });
			    $("#chart-"+id).empty();
			    var svg = d3.select("#chart-"+id).append("svg")
			        .attr("width", diameter)
			        .attr("height", diameter)
			      .append("g")
			        .attr("transform", "translate(" + radius + "," + radius + ")");

			    var link = svg.append("g").selectAll(".link"),
			        node = svg.append("g").selectAll(".node");

			   var classes2=JSON.parse(objJson);
			  //  d3.json("readme-flare-imports.json", function(error, classes) {
			      var nodes = cluster.nodes(packageHierarchy(classes2)),
			          links = packageImports(nodes);

			      link = link
			          .data(bundle(links))
			        .enter().append("path")
			          .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			          .attr("class", "link")
			          .attr("d", line);

			      node = node
			          .data(nodes.filter(function(n) { return !n.children; }))
			        .enter().append("text")
			          .attr("class", "node")
			          .attr("dy", ".31em")
			          .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			          .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			          .text(function(d) { return d.key; })
			          .on("mouseover", mouseovered)
			          .on("mouseout", mouseouted);
			   // });

			    function mouseovered(d) {
			      node
			          .each(function(n) { n.target = n.source = false; });

			      link
			          .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
			          .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
			        .filter(function(l) { return l.target === d || l.source === d; })
			          .each(function() { this.parentNode.appendChild(this); });

			      node
			          .classed("node--target", function(n) { return n.target; })
			          .classed("node--source", function(n) { return n.source; });
			    }

			    function mouseouted(d) {
			      link
			          .classed("link--target", false)
			          .classed("link--source", false);

			      node
			          .classed("node--target", false)
			          .classed("node--source", false);
			    }

			    d3.select(self.frameElement).style("height", diameter + "px");

			    // Lazily construct the package hierarchy from class names.
			    function packageHierarchy(classes) {
			      var map = {};

			      function find(name, data) {
			        var node = map[name], i;
			        if (!node) {
			          node = map[name] = data || {name: name, children: []};
			          if (name.length) {
			            node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
			            node.parent.children.push(node);
			            node.key = name.substring(i + 1);
			          }
			        }
			        return node;
			      }

			      classes.forEach(function(d) {
			        find(d.name, d);
			      });

			      return map[""];
			    }

			    // Return a list of imports for the given array of nodes.
			    function packageImports(nodes) {
			      var map = {},
			          imports = [];

			      // Compute a map from name to node.
			      nodes.forEach(function(d) {
			        map[d.name] = d;
			      });

			      // For each import, construct a link from the source to target node.
			      nodes.forEach(function(d) {
			        if (d.imports) d.imports.forEach(function(i) {
			          imports.push({source: map[d.name], target: map[i]});
			        });
			      });

			      return imports;
			    }
                	Reveal.removeEventListener('perform-query-'+ id, functions[id], false);
		            Reveal.up();
	            	Reveal.down();
    	        	Reveal.addEventListener('perform-query-'+ id, functions[id]);

		    }

	  })
	  .fail(function() {
	    console.log('error');
	  })
	  .always(function() {
	    console.log( "finished" );
	    // $('h2').css('position', 'absolute');
	    // $('h2').css('top', '0');
//	    $(window).trigger("resize");
		requests = [];

	});
	console.log('REQ ADDED');
	requests.push(req);
}

var functions = {
    '1': function () {visualize_query(1); },
    '2': function () {visualize_query(2); },
    '3': function () {visualize_query(3); },
    '4': function () {visualize_query(4); },
    '5': function () {perform_language_query(5); },
    '6': function () {visualize_query(6); },
    '7': function () {visualize_query(7); },
    '8': function () {visualize_query(8); },
};

$(document).ready(function(){
	Reveal.addEventListener('perform-query-1', functions[1]);
	Reveal.addEventListener('perform-query-2', functions[2]);
	Reveal.addEventListener('perform-query-3', functions[3]);
	Reveal.addEventListener('perform-query-4', functions[4]);
	Reveal.addEventListener('perform-query-5', functions[5]);
	Reveal.addEventListener('perform-query-6', functions[6]);
	Reveal.addEventListener('perform-query-7-1', functions[7]);
	Reveal.addEventListener('perform-query-7-2', functions[8]);
});

//function removeQueryListener() {
//    functions = null;
//};

