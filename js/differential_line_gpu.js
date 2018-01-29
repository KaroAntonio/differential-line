
// Differential Line growth Based off of Alberto Giachino's work on code plastic vv nice
// Requires p5.js https://p5js.org/download/
// http://www.codeplastic.com/2017/07/22/differential-line-growth-with-processing/
// https://github.com/gpujs/gpu.js#options

var max_force = 1;
var max_speed = 0.9;
var desired_separation = 9;
var seperation_cohesion_ratio = 1.1;
var max_edge_len = 5;
var bound_thresh = 20;

var width = window.innerWidth;
var height = window.innerHeight;

const gpu = new GPU();

function init_diff_line(n) {
		
	return gen_circle_line(width/2, height/2,n,10);		
}

function run_diff_line(diff_line) {
	differentiate_line(diff_line);
	grow_line(diff_line);
	return diff_line;
}

const myFunc = gpu.createKernel(function() {
    return this.thread.x;
}).setOutput([100]);

function test_gpu( ) {
		
}

function gen_circle_line(cx, cy, n,r) {
	var d_theta = Math.PI*2/n;
	var diff_line = [];
	
	// seed a circle
	for (var theta=0; theta<Math.PI*2; theta+=d_theta) {
		var x = cx + Math.cos(theta) * r;
		var y = cy + Math.sin(theta) * r;
		diff_line.push(new_node(x,y,max_force, max_speed));
	}
	return diff_line;
	
}

function grow_line(diff_line) {
	for (var i = 0; i < diff_line.length-1; i++) {
		var 	n1 = diff_line[i],
			n2 = diff_line[i+1];
		var d = n1['pos'].dist(n2['pos']);
		
		// insert nodes
		if (d > max_edge_len) {
			var mid = p5.Vector.add(n1['pos'],n2['pos']).div(2);
			var node = new_node(mid.x,mid.y,max_force, max_speed);
			diff_line.splice(i+1,0,node)
		}	
	}
}

function differentiate_line(diff_line) {
	var separation_fs = get_separation_forces(diff_line);
	var cohesion_fs = get_edge_cohesion_forces(diff_line);

	var bound_dist = get_boundary_dist(diff_line);
	var center = new p5.Vector(width/2, height/2);
	
	for (var i=0; i<diff_line.length; i++) {
		var pos = line[i]['pos']
		if (bound_dist - pos.dist(center) < bound_thresh) {
			var separation = separation_fs[i];
			var cohesion = cohesion_fs[i];

			separation.mult(seperation_cohesion_ratio);

			apply_force_to_node(diff_line[i],separation);
			apply_force_to_node(diff_line[i],cohesion);
			update_node(diff_line[i]);
		}
	}
}

function get_boundary_dist(line) {
	// the distance of the 'outer edge' of the form
	max_dist = 0;
	var center = new p5.Vector(width/2, height/2);
	for (var i = 0; i < line.length ; i++ ) {
		var dist = center.dist(line[i]['pos'])	
		if (dist > max_dist)
			max_dist = dist
	}
	return max_dist;
}

function get_separation_forces(diff_line) {
	var center = new p5.Vector(width/2, height/2);
	var bound_dist = get_boundary_dist(diff_line); // TIME: N

	var n = diff_line.length;
	var separation_fs = [];
	var near_nodes = [];

	var node_i;
	var node_j;

	for (var i=0; i<n; i++) {
		separation_fs.push(new p5.Vector(0,0));
		near_nodes[i] = 0;
	}

	for (var i=0; i<n; i++) {
		node_i = diff_line[i];
		var dist = center.dist(diff_line[i]['pos'])	
		if (bound_dist - dist < bound_thresh) {
		for (var j=i+1; j<n; j++) {
			node_j = diff_line[j] 

			var force_ij = get_separation_force(node_i, node_j);
			if (force_ij.mag()>0) {
				separation_fs[i].add(force_ij);        
				separation_fs[j].sub(force_ij);
				near_nodes[i]++;
				near_nodes[j]++;
			}
		}

		if (near_nodes[i]>0) {
			separation_fs[i].div(near_nodes[i]);
		}
		if (separation_fs[i].mag() >0) {
			separation_fs[i].setMag(max_speed);
			separation_fs[i].sub(diff_line[i]['v']);
			separation_fs[i].limit(max_force);
		}
		}
	}

	return separation_fs;
}

function get_separation_force(n1, n2) {
	var steer = new p5.Vector(0, 0);
	var sq_d = (n2['pos'].x-n1['pos'].x)**2+(n2['pos'].y-n1['pos'].y)**2;

	if (sq_d>0 && sq_d<desired_separation**2) {
		var diff = p5.Vector.sub(n1['pos'], n2['pos']);
		diff.normalize();
		diff.div(Math.sqrt(sq_d)); //Weight by distance
		steer.add(diff);
	}
	return steer;
}

function get_edge_cohesion_forces(diff_line) {
	var n = diff_line.length;
	var cohesion_fs = []

	for (var i=0; i<n; i++) {
		var sum = new p5.Vector(0, 0);      
		if (i!=0 && i!=n-1) {
			sum.add(diff_line[i-1]['pos']).add(diff_line[i+1]['pos']);
		} else if (i == 0) {
			sum.add(diff_line[n-1]['pos']).add(diff_line[i+1]['pos']);
		} else if (i == n-1) {
			sum.add(diff_line[i-1]['pos']).add(diff_line[0]['pos']);
		}
		sum.div(2);
		cohesion_fs.push(seek_node(diff_line[i],sum));
	}

	return cohesion_fs;
}

function new_node(x, y, mF, mS) {
	return {
		'pos': new p5.Vector(x,y),
		'a':new p5.Vector(0,0),
		'v':p5.Vector.random2D(),
		'mF':mF,
		'mS':mS,
		}
}

function apply_force_to_node(node, force) {
	node['a'].add(force);
}

function update_node(node) {
	node['v'].add(node['a']);
	node['v'].limit(node['mS']);	
	node['pos'].add(node['v']);
	node['a'].mult(0);
}

function seek_node(node,target) {
	var des = target.sub(node['pos']);
	des.setMag(node['mS']);
	var steer = des.sub(node['v']);
	steer.limit(node['mF']);

	return steer;
}

