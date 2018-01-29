
var width = window.innerWidth;
var height = window.innerHeight;

function init_context() {

        var canvas = $('<canvas>')
        canvas.appendTo('body');
        canvas.css({
                width:width,
                height:height
        });
        //Always check for properties and methods, to make sure your code doesn't break in other browsers.
        if (canvas[0].getContext)
        {
                ctx = canvas[0].getContext('2d');
                ctx.canvas.width = width;
                ctx.canvas.height = height;
                ctx.imageSmoothingEnabled = true;
        } else {
                console.log('NO CONTEXT BOIIII');
        }

	return ctx;
}

function draw_loop(ctx,diff_line, weight,c) {
        // draws a line as a loop where the last point connects to the first
        ctx.lineWidth=weight;
        ctx.beginPath();
        ctx.moveTo(diff_line[0]['pos'].x,diff_line[0]['pos'].y);
        ctx.stroke();
	//var i_str = String(256-(i*4)%256) 
	var i_str = c;	
	ctx.strokeStyle = 'rgb('+i_str+','+i_str+','+i_str+')';
        for (var i=0; i < diff_line.length; i++) {
                var pt = diff_line[i]
                ctx.lineTo(pt['pos'].x,pt['pos'].y);
                ctx.stroke();
        }

        ctx.lineTo(diff_line[0]['pos'].x,diff_line[0]['pos'].y);
        ctx.stroke();
}
