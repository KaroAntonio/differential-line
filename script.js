
var width = window.innerWidth;
var height = window.innerHeight;

var canvas, ctx;

var line;

var ctr = 0;

var last_fps_time = Date.now();
var n_frames = 0;

$(document).ready(function() {
	$('#loading').hide();
})

function setup() {

        $('#loading').hide();

        width = window.innerWidth;
        height = window.innerHeight;

        canvas = createCanvas(width, height).canvas
        $(canvas).css({top:0})

        ctx = canvas.getContext('2d');

        line = init_diff_line(10);

        //background(0)
}

function draw() {
	ctr+=1;
	
	line = run_diff_line(line);	
	draw_loop(ctx,line,1, ctr%200)

	$('#line-len').html('line len: '+ line.length)

	log_fps();
}

function log_fps() {
	// log fps
	n_frames += 1;
	if (Date.now() - last_fps_time > 1000) {
		var fps = Math.round((n_frames/((Date.now()-last_fps_time))*1000));
		$('#fps').html('fps: '+ fps)

		last_fps_time = Date.now()
		n_frames = 0;
	}
	
}


