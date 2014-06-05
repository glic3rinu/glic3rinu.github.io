$(window).resize(function() {
    console.log('resize');
});

function visualize_query(id) {
      	var text = $("#query-"+id).text();
   	$("#chart-"+id).prepend('<p><small>Querying database backend <span id="dancing-dots-text"> <span><span>.</span><span>.</span><span>.</span></span></span></small></p>');
   	console.log('aaaa ' + id);
	$.post( "http://graph.calmisko.org/db/data/cypher", { query: text}, function() {
	  console.log( "success" );
	})
	  .done(function(data) {
	    console.log( "Dades" + data.data + "ciao");
	    console.log(data.data.length);
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

	    $.getScript('http://d3js.org/d3.v3.min.js', function(){
	    var diameter = 860,
        format = d3.format(",d"),
        color = d3.scale.category20c();

	    var bubble = d3.layout.pack()
	        .sort(null)
	        .size([diameter, diameter])
	        .padding(1.5);
	    $("#chart-"+id).empty();

	    var svg = d3.select("#chart-"+id).append("svg")
	        .attr("width", diameter)
	        .attr("height", diameter)
	        .attr("class", "bubble");


	    root=JSON.parse(objJson);
	      var node = svg.selectAll(".node")
	          .data(bubble.nodes(classes(root))
	          .filter(function(d) { return !d.children; }))
	        .enter().append("g")
	          .attr("class", "node")
	          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	      node.append("title")
	          .text(function(d) { return d.className + ": " + format(d.value); });

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
//	        console.log( 'perform-query-'+ id );
	      return {children: classes};
	    }

	    d3.select(self.frameElement).style("height", diameter + "px");
	    })

	  })
	  .fail(function() {
	    alert( "error" );
	  })
	  .always(function() {
	    console.log( "finished" );
	    // $('h2').css('position', 'absolute');
	    // $('h2').css('top', '0');
//	    $(window).trigger("resize");


	});
}

var functions = {
    '1': function () {visualize_query(1); },
    '2': function () {visualize_query(2); },
    '3': function () {visualize_query(3); },
    '4': function () {visualize_query(4); },
};

$(document).ready(function(){
	Reveal.addEventListener('perform-query-1', functions[1]);
	Reveal.addEventListener('perform-query-2', functions[2]);
	Reveal.addEventListener('perform-query-3', functions[3]);
	Reveal.addEventListener('perform-query-4', functions[4]);

});

//function removeQueryListener() {
//    functions = null;
//};

