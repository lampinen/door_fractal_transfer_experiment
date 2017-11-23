// fractal mutation plugin
// adapted from two-door-navigation 

jsPsych.plugins['fractal-mutation'] = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {

    // expected parameters:
    //trial.group = the group
    //trial.fractal_assignment = assignment of fractals to elements
    //trial.mutagen_generator_assignment = assignment of colors white and black to left and right doors, resp. 
    //trial.goal = one of group.elements
    //trial.start = one of group.elements
    trial.action_noise = trial.action_noise || 0.2; // how often an action "misses"
    trial.canvas_height = trial.canvas_height || 400;
    trial.canvas_width = trial.canvas_width || 600;

    display_element.append($('<canvas>', {
        "id": "mutation-canvas",
        "class": "mutation-canvas",
        "style": "border:1px solid #000000;",
        "css": {
            "position": "relative",
            "width": trial.canvas_width,
            "height": trial.canvas_height
        }
    }).width(trial.canvas_width).height(trial.canvas_height));
    $('#mutation-canvas')[0].width = trial.canvas_width;
    $('#mutation-canvas')[0].height = trial.canvas_height;

    var canvas = $('#mutation-canvas')[0];
    var draw = canvas.getContext("2d");


    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    var current_location = trial.start;

    var location_history = [];
    location_history.push(current_location);

    var action_history = [];
    var door_history = []; // redundant but nevertheless may be informative if there is e.g. a L-R click bias

    var location_rts = [];

    var start_time = (new Date()).getTime();

    var this_location_time = start_time;

    /////// graphics ////////////////////////////////////////////////////

    // all relative to size parameter 
    var ef_bot_width = 0.75;
    var ef_top_width = 0.2;
    var ef_height = 1;
    var ef_neck_length = 0.4; 
    var ef_bottom_curve = 0.1;
    var ef_grad_width = 0.15;
    var x_pad = 0.2;
    
    function draw_erlenmeyer(x, y, size) {
        x = x + size * x_pad; //because I'm lazy 
        var ef_height_exclusive = ef_height - 2 * ef_bottom_curve; //conservative 
        var ef_slope_height = (ef_height_exclusive - ef_neck_length);
        var phi = Math.atan(ef_slope_height / (( ef_bot_width-ef_top_width) / 2)); 
        var cos_phi = Math.cos(phi);
        var sin_phi = Math.sin(phi);

        var ef_path = function(partial) {
            if (!partial) {
                draw.beginPath();
                draw.moveTo(x + size * (ef_bot_width-ef_top_width) / 2, y);
                draw.lineTo(x  + size * (ef_bot_width-ef_top_width) / 2, y + size * ef_neck_length); 
                draw.lineTo(x, y + size * ef_height_exclusive) 
            } else {
                draw.beginPath();
                draw.moveTo(x + size * ((ef_slope_height / 3) * cos_phi), y + size * (ef_height_exclusive- (ef_slope_height / 3) * sin_phi));
                draw.lineTo(x, y + size * ef_height_exclusive) 
            }
            draw.arcTo(x - size * 2 *ef_bottom_curve * cos_phi, 
                       y + size * (ef_height_exclusive + 2 * ef_bottom_curve * sin_phi),  
                       x + size * (ef_bottom_curve * sin_phi),
                       y + size * (ef_height_exclusive + ef_bottom_curve * (1 + cos_phi)),
                       size * ef_bottom_curve);
            draw.lineTo(x + size * (ef_bot_width - ef_bottom_curve * sin_phi), y + size * (ef_height_exclusive + ef_bottom_curve * (1 + cos_phi)));
            draw.arcTo(x + size * (ef_bot_width + ef_bottom_curve * sin_phi), 
                       y + size * (ef_height_exclusive + ef_bottom_curve * (1 + cos_phi)), 
                       x + size * (ef_bot_width),
                       y + size * ef_height_exclusive,
                       size * ef_bottom_curve);
            if (!partial) {
                draw.lineTo(x  + size * (ef_bot_width + ef_top_width) / 2, y + size * ef_neck_length); 
                draw.lineTo(x  + size * (ef_bot_width + ef_top_width) / 2, y); 
            } else {
                draw.lineTo(x + size * (ef_bot_width - (ef_slope_height / 3) * cos_phi), y + size * (ef_height_exclusive- (ef_slope_height / 3) * sin_phi));
            }
            draw.closePath();
        }
        ef_path();
        draw.globalAlpha = 0.3;
        draw.strokeStyle = "SlateGray";
        draw.lineWidth = 5;
        draw.stroke()
        ef_path();
        draw.strokeStyle = "CadetBlue";
        draw.lineWidth = 2;
        draw.stroke()
        ef_path();
        draw.globalAlpha = 1;
        draw.strokeStyle = "DarkSlateGray";
        draw.lineWidth = 1;
        draw.stroke()
        ef_path(true);
        draw.globalAlpha = 0.7
        draw.fillStyle = "Red"; 
        draw.fill();
        ef_path();
        draw.globalAlpha = 0.2;
        draw.fillStyle = "LightBlue";
        draw.fill();
        draw.globalAlpha = 1;


        draw.lineWidth = 2;
        draw.strokeStyle = "DarkSlateGray";
        draw.beginPath();
        draw.moveTo(x + size * ef_bot_width, y + size * ef_height_exclusive);
        draw.lineTo(x + size * (ef_bot_width - ef_grad_width), y + size * ef_height_exclusive);
        draw.stroke()

        draw.beginPath();
        draw.moveTo(x + size * (ef_bot_width - (ef_slope_height / 3) * cos_phi), y + size * (ef_height_exclusive- (ef_slope_height / 3) * sin_phi));
        draw.lineTo(x + size * (ef_bot_width  - (ef_slope_height / 3) * cos_phi - ef_grad_width), y + size * (ef_height_exclusive - (ef_slope_height / 3) * sin_phi));
        draw.stroke()

        draw.beginPath();
        draw.moveTo(x + size * (ef_bot_width - (2 * ef_slope_height / 3) * cos_phi), y + size * (ef_height_exclusive- (2 * ef_slope_height / 3) * sin_phi));
        draw.lineTo(x + size * (ef_bot_width  - (2 * ef_slope_height / 3) * cos_phi - ef_grad_width), y + size * (ef_height_exclusive - (2 * ef_slope_height / 3) * sin_phi));
        draw.stroke()
    }

    var gamma_ray_1_rad = 0.2;
    var gamma_ray_2_rad = 0.15;
    var gamma_ray_3_rad = 0.1;
    var gamma_ray_rod_length = 0.15;
    var gamma_ray_rod_width = 0.075;
    function draw_gamma_ray(x, y, size) {

        var theta = 0.2 * Math.PI;
        var sin_theta = Math.sin(theta);
        var cos_theta = Math.cos(theta);
        draw.setTransform(cos_theta, -sin_theta, sin_theta, cos_theta, x + gamma_ray_1_rad * size, y - gamma_ray_1_rad * size);
        draw.strokeStyle = "Indigo";
        draw.fillStyle = "Gold";
        draw.beginPath();
        draw.rect(gamma_ray_1_rad * size, - 0.5 * gamma_ray_rod_width * size, size * gamma_ray_rod_length, size*gamma_ray_rod_width); 
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.rect((gamma_ray_1_rad+2*gamma_ray_2_rad+gamma_ray_rod_length) * size, - 0.5 * gamma_ray_rod_width * size, size * gamma_ray_rod_length, size*gamma_ray_rod_width); 
        draw.fill();
        draw.stroke();
        draw.fillStyle = "Silver";
        draw.beginPath()
        draw.arc(0, 0, gamma_ray_1_rad * size, 0, 2 * Math.PI); 
        draw.fill();
        draw.stroke();
        draw.beginPath()
        draw.arc((gamma_ray_1_rad+gamma_ray_2_rad+gamma_ray_rod_length) * size, 0, gamma_ray_2_rad * size, 0, 2 * Math.PI); 
        draw.fill();
        draw.stroke();
        draw.beginPath()
        draw.arc((gamma_ray_1_rad+2 *gamma_ray_2_rad+ 2 * gamma_ray_rod_length + gamma_ray_3_rad) * size, 0, gamma_ray_3_rad * size, 0, 2 * Math.PI); 
        draw.fill();
        draw.stroke();
        draw.setTransform(1, 0, 0, 1, 0, 0);
    }

    function mutagen_contains(mutagen_loc,x,y) { //Returns whether (x,y) on the canvas is 'within' the mutagen 
        if (mutagen_loc == 0) {
            curr_mutagen_loc = liquid_mutagen_loc; 
        } else {
            curr_mutagen_loc = ray_mutagen_loc; 
        }
        return ; 
    }

    

    // Room event handlers
    var clickable = true;

    var getMouse = function(e,canvas) { //Gets mouse location relative to canvas, code stolen from https://github.com/simonsarris/Canvas-tutorials/blob/master/shapes.js 
	    var element = canvas;
	    var offsetX = 0;
	    var offsetY = 0;
	    var html = document.body.parentNode;
	    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
	    if (element.offsetParent !== undefined) {
		    do {
			    offsetX += element.offsetLeft;
			    offsetY += element.offsetTop;
		    } while ((element = element.offsetParent));
	    }

	    if (document.defaultView && document.defaultView.getComputedStyle) {
		    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
		    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
		    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
		    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
	    }
	    htmlTop = html.offsetTop;
	    htmlLeft = html.offsetLeft;
	    offsetX += stylePaddingLeft + styleBorderLeft + htmlLeft;
	    offsetY += stylePaddingTop + styleBorderTop + htmlTop;

	    mx = e.pageX - offsetX;
	    my = e.pageY - offsetY;
	    return {x: mx, y: my};
    };

    function next_fractal(current_location, action) {
        if (Math.random() < trial.action_noise) {
            action = 1 - action;
        }
        var generators = trial.group.get_some_generators()
        new_location = trial.group.operation(current_location, generators[trial.door_generator_assignment[action]]); 
        return new_location;
    }

    function display_congratulations() {
        // reduce opacity of background
    }

    canvas.addEventListener('mousedown', function(e) {
        if (!clickable) {
            return;
        }
        var mouse = getMouse(e, canvas);
        var mutagen_loc;
        if (mutagen_contains(0, mouse.x, mouse.y)) {
            //go through left mutagen
            mutagen_loc = 0;

        } else if (mutagen_contains(1, mouse.x, mouse.y)) {
            //go through right mutagen
            mutagen_loc = 1;
        } else {
            //mis-click, ignore
            return;
        }
        // update everything 
        var curr_time = (new Date()).getTime();
        location_rts.push(curr_time - this_location_time);
        mutagen_history.push(mutagen_loc);
        var this_action = trial.mutagen_generator_assignment[mutagen_loc]; 
        current_location = next_fractal(current_location, this_action);
        action_history.push(this_action); 

        // animate
        clickable = false;
        animate_mutation(mutagen_loc, function() {
            draw_current_fractal(current_location);
            location_history.push(current_location);
            this_location_time = (new Date()).getTime();

            if (current_location == trial.goal) {
                setTimeout(function() {
                    display_congratulations();
                    setTimeout(end_function, 2000); 
                }, 500);
            } else {
                clickable = true;
            }
        })

        return;
    }, true);

    // putting it all together

    function draw_current_fractal(current_location) {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        draw_erlenmeyer(10, 50, 125);
        draw_gamma_ray(10, canvas.height - 10, 125)
    }

    ////// End fractal stuff /////////////////////////////////////////////////////////
    
    function end_function() {

      display_element.html('');

      var trial_data = {
        "group": trial.group.get_name(),
        "fractal_assignment": trial.fractal_assignment,
        "mutagen_generator_assignment": trial.mutagen_generator_assignment,
        "goal": trial.goal,
        "start": trial.start,
        "action_noise": trial.action_noise,
        "location_history": JSON.stringify(location_history),
        "action_history": JSON.stringify(action_history),
        "mutagen_history": JSON.stringify(mutagen_history),
        "location_rts": JSON.stringify(location_rts)
      };

      jsPsych.finishTrial(trial_data);
    }

    draw_current_fractal(current_location);

  };

  return plugin;
})();
