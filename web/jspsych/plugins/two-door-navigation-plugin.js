// two-door-navigation-plugin 
// adapted from jspych demons

jsPsych.plugins['two-door-navigation'] = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {

    // expected parameters:
    //trial.group = the group
    //trial.room_assignment = assignment of room colors to elements
    //trial.door_color_assignment = assignment of colors white and black to left and right doors, resp. 
    //trial.door_generator_assignment = assignment of door positions to generators (should be [0, 1] or [1, 0])
    //trial.goal = one of group.elements
    //trial.start = one of group.elements
    trial.action_noise = trial.action_noise || 0.2; // how often an action "misses"
    trial.canvas_height = trial.canvas_height || 400;
    trial.canvas_width = trial.canvas_width || 600;

    display_element.append($('<canvas>', {
        "id": "room-canvas",
        "class": "room-canvas",
        "style": "border:1px solid #000000;",
        "css": {
            "position": "relative",
            "width": trial.canvas_width,
            "height": trial.canvas_height
        }
    }).width(trial.canvas_width).height(trial.canvas_height));
    $('#room-canvas')[0].width = trial.canvas_width;
    $('#room-canvas')[0].height = trial.canvas_height;

    var canvas = $('#room-canvas')[0];
    var draw = canvas.getContext("2d");


    display_element.append('<div id="instruction-div">Goal: find your way to the ' + trial.room_assignment[trial.goal] + ' room!<br /><br /></div>');

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

    var this_room_time = start_time;

    /////// Room graphics ////////////////////////////////////////////////////

    var floor_height = 0.1;
    var ceiling_height = 0.1;
    var wall_width = 0.1;
    // helpers for drawing vertically oriented trapezoids
    function draw_trapezoid(x, y, width, left_height, right_height, offset) {
        offset = offset || Math.abs(left_height  - right_height) / 2;
        draw.beginPath();
        if (left_height >= right_height) {
            draw.moveTo(x, y);
            draw.lineTo(x, y + left_height);
            draw.lineTo(x + width, y + right_height + offset);
            draw.lineTo(x + width, y + offset);
            draw.closePath();
        } else {
            draw.moveTo(x + width, y);
            draw.lineTo(x + width, y + right_height);
            draw.lineTo(x, y + left_height + offset);
            draw.lineTo(x, y + offset);
            draw.closePath();
        }
    }

    var shrink_constant = 0.25;
    function draw_foreshortened_trapezoid(x, y, original_width, left_height, angle) {
        var width = Math.cos(angle)*original_width;
        var right_height = left_height - 2*shrink_constant*Math.sin(angle)*width;
        draw_trapezoid(x, y, width, left_height, right_height);
    }

    // horizontal 
    function draw_trapezoid_h(x, y, bottom_width, top_width, height) {
        draw.beginPath();
        draw.moveTo(x, y);
        draw.lineTo(x + bottom_width, y);
        draw.lineTo(x + (bottom_width + top_width) / 2, y - height);
        draw.lineTo(x + (bottom_width - top_width) / 2, y - height);
        draw.closePath();
    }

    // Making doors
    var door_width = trial.canvas_width/5;
    var door_height = 2*trial.canvas_height/3;
    var left_door_loc = trial.canvas_width/5;
    var right_door_loc = 3*trial.canvas_width/5;
    var door_offset = trial.canvas_height/3 - (floor_height * trial.canvas_height);

    var door_inlay_width = trial.canvas_width/25;
    var door_inlay_height = 3*door_height/11; 
    var door_inlay_offset_x = trial.canvas_width/25;
    var door_inlay1_offset_y = door_height/11;
    var door_inlay2_offset_y = 3*door_height/11;
    var door_inlay3_offset_y = 7 * door_height/11;
    var doorknob_diameter = door_height/33;
    var doorknob_offset_x = trial.canvas_width/50;
    var doorknob_offset_y = 6.5*door_height/11;
    var doorknob_offset_z = trial.canvas_width/150;

    function draw_door(door_loc, angle) {
        angle = angle || 0;
        var cos_angle = Math.cos(angle);
        var van_dist = (door_height/2) * (cos_angle/ (shrink_constant * Math.sin(angle) ));
        var door_color = trial.door_color_assignment[door_loc];
        var curr_door_loc = 0;
        if (door_loc == 0) {
            curr_door_loc = left_door_loc; 
        } else {
            curr_door_loc = right_door_loc; 
        }
        if (angle == 0) {
	    draw.fillStyle = door_color;
	    draw.fillRect(curr_door_loc, door_offset, door_width, door_height);
	    draw.strokeStyle = trial.door_color_assignment[1-door_loc]; 
	    draw.strokeRect(curr_door_loc, door_offset, door_width, door_height);
	    draw.strokeRect(curr_door_loc + door_inlay_offset_x,
                            door_offset + door_inlay1_offset_y,
                            door_inlay_width,
                            door_inlay_width);
	    draw.strokeRect(curr_door_loc + door_inlay_offset_x,
	       	            door_offset + door_inlay2_offset_y,
	       	            door_inlay_width,
	       	            door_inlay_height);
	    draw.strokeRect(curr_door_loc + door_inlay_offset_x,
	       	            door_offset + door_inlay3_offset_y,
	       	            door_inlay_width,
	       	            door_inlay_height);
	    draw.strokeRect(curr_door_loc + door_width - door_inlay_width - door_inlay_offset_x,
	       	            door_offset + door_inlay1_offset_y,
	       	            door_inlay_width,
	       	            door_inlay_width);
	    draw.strokeRect(curr_door_loc + door_width - door_inlay_width - door_inlay_offset_x,
	       	            door_offset + door_inlay2_offset_y,
	       	            door_inlay_width,
	       	            door_inlay_height);
	    draw.strokeRect(curr_door_loc + door_width - door_inlay_width - door_inlay_offset_x,
	       	            door_offset + door_inlay3_offset_y,
	       	            door_inlay_width,
	       	            door_inlay_height);
	    draw.fillStyle = "gold";
	    draw.beginPath()
	    draw.ellipse(curr_door_loc + (door_width - doorknob_offset_x),
			 door_offset + doorknob_offset_y,
			 doorknob_diameter,
			 doorknob_diameter,
			 0,
			 0,
			 2*Math.PI);
	    draw.fill();
        } else {

	    draw.fillStyle = "black";
	    draw.fillRect(curr_door_loc, door_offset, door_width, door_height);
	    
	    draw.fillStyle = door_color;
	    draw.strokeStyle = trial.door_color_assignment[1-door_loc]; 
	    draw_trapezoid(curr_door_loc, door_offset, cos_angle * door_width, door_height,  door_height - 2*shrink_constant*Math.sin(angle)*door_width);
	    draw.fill();
	    draw.stroke();

	    var door_half_height = door_height / 2;
	    draw_trapezoid(curr_door_loc + cos_angle*door_inlay_offset_x,
			   door_offset + door_half_height - (door_half_height - door_inlay1_offset_y) * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
			   door_inlay_width * cos_angle,
			   door_inlay_width * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
			   door_inlay_width * (van_dist - cos_angle*(door_inlay_offset_x + door_inlay_width)) / van_dist,
			   (door_half_height - (door_inlay1_offset_y)) * (cos_angle*(door_inlay_width) / van_dist));
	    draw.stroke();
	    draw_trapezoid(curr_door_loc + cos_angle*door_inlay_offset_x,
			   door_offset + door_half_height - (door_half_height - door_inlay2_offset_y) * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
			   door_inlay_width * cos_angle,
			   door_inlay_height * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
			   door_inlay_height * (van_dist - cos_angle*(door_inlay_offset_x + door_inlay_width)) / van_dist,
			   (door_half_height - (door_inlay2_offset_y)) * (cos_angle*(door_inlay_width) / van_dist));
	    draw.stroke();
	    draw_trapezoid(curr_door_loc + cos_angle*door_inlay_offset_x,
			   door_offset + door_half_height - (door_half_height - door_inlay3_offset_y) * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
			   door_inlay_width * cos_angle,
			   door_inlay_height * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
			   door_inlay_height * (van_dist - cos_angle*(door_inlay_offset_x + door_inlay_width)) / van_dist,
			   (door_half_height - (door_inlay3_offset_y)) * (cos_angle*(door_inlay_width) / van_dist));
	    draw.stroke();
	    var door_right_inlay_offset_x = door_width - door_inlay_width - door_inlay_offset_x;
	    draw_trapezoid(curr_door_loc + cos_angle*door_right_inlay_offset_x,
			   door_offset + door_half_height - (door_half_height - door_inlay1_offset_y) * (van_dist - cos_angle*door_right_inlay_offset_x) / van_dist,
			   door_inlay_width * cos_angle,
			   door_inlay_width * (van_dist - cos_angle*door_right_inlay_offset_x) / van_dist,
			   door_inlay_width * (van_dist - cos_angle*(door_right_inlay_offset_x + door_inlay_width)) / van_dist,
			   (door_half_height - (door_inlay1_offset_y)) * (cos_angle*(door_inlay_width) / van_dist));
	    draw.stroke();
	    draw_trapezoid(curr_door_loc + cos_angle*door_right_inlay_offset_x,
			   door_offset + door_half_height - (door_half_height - door_inlay2_offset_y) * (van_dist - cos_angle*door_right_inlay_offset_x) / van_dist,
			   door_inlay_width * cos_angle,
			   door_inlay_height * (van_dist - cos_angle*door_right_inlay_offset_x) / van_dist,
			   door_inlay_height * (van_dist - cos_angle*(door_right_inlay_offset_x + door_inlay_width)) / van_dist,
			   (door_half_height - (door_inlay2_offset_y)) * (cos_angle*(door_inlay_width) / van_dist));
	    draw.stroke();
	    draw_trapezoid(curr_door_loc + cos_angle*door_right_inlay_offset_x,
			   door_offset + door_half_height - (door_half_height - door_inlay3_offset_y) * (van_dist - cos_angle*door_right_inlay_offset_x) / van_dist,
			   door_inlay_width * cos_angle,
			   door_inlay_height * (van_dist - cos_angle*door_right_inlay_offset_x) / van_dist,
			   door_inlay_height * (van_dist - cos_angle*(door_right_inlay_offset_x + door_inlay_width)) / van_dist,
			   (door_half_height - (door_inlay3_offset_y)) * (cos_angle*(door_inlay_width) / van_dist));
	    draw.stroke();
	    draw.fillStyle = "gold";
	    draw.beginPath()
	    draw.ellipse(curr_door_loc + (door_width - doorknob_offset_x) * cos_angle + doorknob_offset_z * Math.sin(angle),
			 door_offset + door_half_height + (doorknob_offset_y - door_half_height) * (van_dist - cos_angle * (door_width - doorknob_offset_x)) / van_dist,
			 doorknob_diameter * 0.5 * (1 + cos_angle),
			 doorknob_diameter,
			 0,
			 0,
			 2*Math.PI);
	    draw.fill();
        }

    }

    var window_width = 0.15 * canvas.width;
    var window_height = 0.22 * canvas.height;
    function draw_window(x, y) {
        draw.beginPath();
        draw.rect(x, y, window_width, window_height);
        draw.fillStyle = "LightCyan";
        draw.fill();
        draw.strokeStyle = "Black";
        draw.lineWidth  = 5;
        draw.stroke();
        draw.beginPath();
        draw.moveTo(x + window_width/2, y);
        draw.lineTo(x + window_width/2, y + window_height);
        draw.stroke();
        draw.beginPath();
        draw.moveTo(x, y + window_height/2);
        draw.lineTo(x + window_width, y + window_height/2);
        draw.stroke();
        draw.lineWidth  = 1;
    }

    var table_offset = 0.05 * canvas.height;
    var table_height = 0.15 * canvas.height;
    var table_width = 0.15 * canvas.width;
    var table_top_height = 0.2;
    var table_top_thickness = 0.1;
    var table_top_width = 0.8;
    var table_leg_thickness = 0.12;
    
    var table_leg_side_thickness = 0.25; //relative
    var table_leg_height = table_height * (1-table_top_height - table_top_thickness);

    function draw_table(x, fill_color, stroke_color) {
        draw.fillStyle = fill_color;
        draw.strokeStyle = stroke_color || "Black";
        //legs
        draw_trapezoid(x + (table_leg_thickness + (1-table_top_width) * 0.5) * table_width, canvas.height - table_leg_height - table_top_height * table_height - table_offset, table_leg_side_thickness * table_leg_thickness * table_width, table_leg_height, table_leg_height, -0.05 * table_leg_height);
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.rect(x + (1-table_top_width) * 0.5 * table_width, canvas.height - table_leg_height - table_top_height * table_height - table_offset, table_width * table_leg_thickness, table_leg_height); 
        draw.fill();
        draw.stroke();

        draw_trapezoid(x + (1- (1-table_top_width) * 0.5 - (1 + table_leg_side_thickness) * table_leg_thickness) * table_width, canvas.height - 1.05 * table_leg_height - table_top_height * table_height - table_offset, 0.25 * table_leg_thickness * table_width, table_leg_height, table_leg_height, 0.05 * table_leg_height);
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.rect(x + (1- (1-table_top_width) * 0.5-table_leg_thickness) * table_width, canvas.height - table_leg_height - table_top_height * table_height - table_offset, table_width * table_leg_thickness, table_leg_height); 
        draw.fill();
        draw.stroke();

        draw_trapezoid(x + table_leg_thickness * table_width, canvas.height - table_leg_height - table_offset, table_leg_side_thickness * table_leg_thickness * table_width, table_leg_height, table_leg_height, -0.05 * table_leg_height);
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.rect(x, canvas.height - table_leg_height - table_offset, table_width * table_leg_thickness, table_leg_height); 
        draw.fill();
        draw.stroke();

        draw_trapezoid(x + (1- (1 + table_leg_side_thickness) * table_leg_thickness) * table_width, canvas.height - 1.05 * table_leg_height - table_offset, 0.25 * table_leg_thickness * table_width, table_leg_height, table_leg_height, 0.05 * table_leg_height);
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.rect(x + (1-table_leg_thickness) * table_width, canvas.height - table_leg_height - table_offset, table_width * table_leg_thickness, table_leg_height); 
        draw.fill();
        draw.stroke();

        // Top
        draw_trapezoid_h(x, canvas.height - table_height * (1-table_top_height) - table_offset,  table_width, table_width * table_top_width, table_top_height * table_height);
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.rect(x,canvas.height - table_height * (1-table_top_height) - table_offset, table_width, table_top_thickness * table_height); 
        draw.fill();
        draw.stroke();
    }
    
    
    var animation_time = 500; //length of animation in ms
    var post_animation_delay = 500; // how long to wait on last frame
    var num_frames = 20;
    var frame_time = animation_time/num_frames;
    function animate_door_opening(door_loc, callback, remaining_frames) {
            if (remaining_frames === 0) {
                setTimeout(callback, post_animation_delay);
                return;
            }
            remaining_frames = remaining_frames || num_frames;
            draw_door(door_loc, 0.5 * Math.PI * (1 - remaining_frames/num_frames)); 
            setTimeout(function() {
                animate_door_opening(door_loc, callback, remaining_frames-1);
            }, frame_time);
    }


    function door_contains(door_loc,x,y) { //Returns whether (x,y) on the canvas is 'within' the door 
        if (door_loc == 0) {
            curr_door_loc = left_door_loc; 
        } else {
            curr_door_loc = right_door_loc; 
        }
        return x >= curr_door_loc && x <= curr_door_loc + door_width && y >= door_offset && y <= door_offset + door_height; 
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

    function next_room(current_location, action) {
        if (Math.random() < trial.action_noise) {
            action = 1 - action;
        }
        var generators = trial.group.get_some_generators()
        new_location = trial.group.operation(current_location, generators[action]); 
        return new_location;
    }

    function display_congratulations() {
        // reduce opacity of background
        draw.globalAlpha = 0.9;
        draw.fillStyle = "gray";
        draw.fillRect(0, 0, canvas.width, canvas.height);

        draw.globalAlpha = 1;
        draw.textAlign = "center";
        draw.fillStyle = "white";
        draw.font = "40px Arial";
        draw.fillText("Congratulations!", canvas.width/2, canvas.height/2);
    }

    canvas.addEventListener('mousedown', function(e) {
        if (!clickable) {
            return;
        }
        var mouse = getMouse(e, canvas);
        var door_loc;
        if (door_contains(0, mouse.x, mouse.y)) {
            //go through left door
            door_loc = 0;

        } else if (door_contains(1, mouse.x, mouse.y)) {
            //go through right door
            door_loc = 1;
        } else {
            //mis-click, ignore
            return;
        }
        // update everything 
        var curr_time = (new Date()).getTime();
        location_rts.push(curr_time - this_room_time);
        door_history.push(door_loc);
        var this_action = trial.door_generator_assignment[door_loc]; 
        current_location = next_room(current_location, this_action);
        action_history.push(this_action); 

        // animate
        clickable = false;
        animate_door_opening(door_loc, function() {
            draw_current_room(current_location);
            location_history.push(current_location);
            this_room_time = (new Date()).getTime();

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

    function draw_current_room(current_location) {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        var room_color = trial.room_assignment[current_location];

        // walls
        draw.fillStyle = room_color;
        draw.strokeStyle = "Black";
        draw.lineWidth = 2;
        draw.fillRect(0, 0, canvas.width, canvas.height);
        draw_trapezoid(0, 0, canvas.width * wall_width, canvas.height, (1-(floor_height + ceiling_height)) * canvas.height); 
        draw.stroke();
        draw_trapezoid(canvas.width * (1- wall_width), 0, canvas.width * wall_width, (1-(floor_height + ceiling_height)) * canvas.height, canvas.height); 
        draw.stroke();
        draw_trapezoid_h(canvas.width * wall_width, canvas.height * ceiling_height, canvas.width * (1 - 2 * wall_width), canvas.width, canvas.height * ceiling_height); 
        draw.stroke();
        draw_trapezoid_h(0, canvas.height, canvas.width, canvas.width * (1 - 2 * wall_width), canvas.height * ceiling_height); 
        draw.stroke();
        draw.lineWidth = 1;

        // Doors
        draw_door(0); draw_door(1);
        // Room eye candy
        if (room_color === "red") {
//            draw_window(10, canvas.height/3);
            draw_table(canvas.width * 0.425, "DarkRed"); 
        }
    }

    ////// End room stuff /////////////////////////////////////////////////////////
    
    function end_function() {

      display_element.html('');

      var trial_data = {
        "group": trial.group.get_name(),
        "room_assignment": trial.room_assignment,
        "door_color_assignment": trial.door_color_assignment,
        "door_generator_assignment": trial.door_generator_assignment,
        "goal": trial.goal,
        "start": trial.start,
        "action_noise": trial.action_noise,
        "location_history": JSON.stringify(location_history),
        "action_history": JSON.stringify(action_history),
        "door_history": JSON.stringify(door_history),
        "location_rts": JSON.stringify(location_rts)
      };

      jsPsych.finishTrial(trial_data);
    }

    draw_current_room(current_location);

  };

  return plugin;
})();
