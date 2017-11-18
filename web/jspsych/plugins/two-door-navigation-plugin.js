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

    var room_rts = [];

    var start_time = (new Date()).getTime();

    var this_room_time = start_time;

    /////// Room graphics ////////////////////////////////////////////////////
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

    var shrink_constant = 0.2;
    function draw_foreshortened_trapezoid(x, y, original_width, left_height, angle) {
        var width = Math.cos(angle)*original_width;
        var right_height = left_height - 2*shrink_constant*Math.sin(angle)*width;
        draw_trapezoid(x, y, width, left_height, right_height);
    }

    // Making doors
    var door_width = trial.canvas_width/5;
    var door_height = 2*trial.canvas_height/3;
    var left_door_loc = trial.canvas_width/5;
    var right_door_loc = 3*trial.canvas_width/5;
    var door_offset = trial.canvas_height/3;

    var door_inlay_width = trial.canvas_width/25;
    var door_inlay_height = 3*door_height/11; 
    var door_inlay_offset_x = trial.canvas_width/25;
    var door_inlay1_offset_y = door_height/11;
    var door_inlay2_offset_y = 3*door_height/11;
    var door_inlay3_offset_y = 7 * door_height/11;
    var doorknob_radius = door_height/33;
    var doorknob_offset_x = trial.canvas_width/50;
    var doorknob_offset_y = 6.5*door_height/11;

    function draw_door(door_loc, angle) {
        angle = angle || 0;
        var cos_angle = Math.cos(angle);
        var van_dist = (door_height / 2) * (door_width * cos_angle / (shrink_constant * Math.sin(angle)));
        var door_color = trial.door_color_assignment[door_loc];
        var curr_door_loc = 0;
        if (door_loc == 0) {
            curr_door_loc = left_door_loc; 
        } else {
            curr_door_loc = right_door_loc; 
        }
        draw.fillStyle = "black";
        draw.fillRect(curr_door_loc, door_offset, door_width, door_height);
        
        draw.fillStyle = door_color;
        draw.strokeStyle = trial.door_color_assignment[1-door_loc]; 
        draw_foreshortened_trapezoid(curr_door_loc, door_offset, door_width, door_height, angle);
        draw.fill();
        draw.stroke();

        var door_half_height = door_height / 2;
        draw_trapezoid(curr_door_loc + cos_angle*door_inlay_offset_x,
                       door_offset + door_half_height - (door_half_height - door_inlay1_offset_y) * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
                       door_inlay_width * cos_angle,
                       door_inlay_width * (van_dist - cos_angle*door_inlay_offset_x) / van_dist,
                       door_inlay_width * (van_dist - cos_angle*(door_inlay_offset_x + door_inlay_width)) / van_dist,
                       (door_half_height - (door_inlay1_offset_y + door_inlay_width)) * (van_dist - cos_angle*(door_inlay_offset_x + door_inlay_width)) / van_dist);
        draw.stroke();
//        draw_foreshortened_trapezoid(curr_door_loc + cos_angle*door_inlay_offset_x,
//                                     door_offset + door_inlay2_offset_y + door_inlay_offset_x * this_shrink,
//                                     door_inlay_width * cos_angle,
//                                     door_inlay_height - 2 * (door_inlay_width + door_inlay_offset_x) * this_shrink,
//                                     angle);
//        draw.stroke();
//        draw_foreshortened_trapezoid(curr_door_loc + cos_angle*door_inlay_offset_x,
//                                     door_offset + door_inlay3_offset_y + door_inlay_offset_x * this_shrink,
//                                     door_inlay_width * cos_angle,
//                                     door_inlay_height - 2 * (door_inlay_width + door_inlay_offset_x) * this_shrink,
//                                     angle);
//        draw.stroke();
//
//        var door_right_inlay_offset_x = door_width - door_inlay_width - door_inlay_offset_x;
//        draw_foreshortened_trapezoid(curr_door_loc + cos_angle * door_right_inlay_offset_x,
//                                     door_offset + door_inlay1_offset_y + door_right_inlay_offset_x * this_shrink,
//                                     door_inlay_width * cos_angle,
//                                     door_inlay_width - 2 * (door_right_inlay_offset_x + door_inlay_width) * this_shrink,
//                                     angle);
//        draw.stroke();
//        draw_foreshortened_trapezoid(curr_door_loc + cos_angle*door_right_inlay_offset_x,
//                                     door_offset + door_inlay2_offset_y + door_right_inlay_offset_x * this_shrink,
//                                     door_inlay_width * cos_angle,
//                                     door_inlay_height - 2 * (door_right_inlay_offset_x + door_inlay_width) * this_shrink,
//                                     angle);
//        draw.stroke();
//        draw_foreshortened_trapezoid(curr_door_loc + cos_angle*door_right_inlay_offset_x,
//                                     door_offset + door_inlay3_offset_y + door_right_inlay_offset_x * this_shrink,
//                                     door_inlay_width * cos_angle,
//                                     door_inlay_height - 2 * (door_right_inlay_offset_x + door_inlay_width)* this_shrink,
//                                     angle);
//        draw.stroke();

        draw.fillStyle = "gold";
        draw.beginPath()
        draw.arc(curr_door_loc + door_width - doorknob_offset_x,
                 door_offset + doorknob_offset_y,
                 doorknob_radius,
                 0,
                 2*Math.PI);
        draw.fill();

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
        new_location = trial.group.operation(current_location, generators[trial.door_generator_assignment[action]]); 
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
        if (door_contains(0, mouse.x, mouse.y)) {
            //go through left door
            current_location = next_room(current_location, 0)
            action_history.push(0); 

        } else if (door_contains(1, mouse.x, mouse.y)) {
            //go through right door
            current_location = next_room(current_location, 1)
            action_history.push(1); 
        } else {
            //mis-click, ignore
            return;
        }
        // update everything
        var curr_time = (new Date()).getTime();
        room_rts.push(curr_time - this_room_time);
        draw_current_room(current_location);
        location_history.push(current_location);
        this_room_time = (new Date()).getTime();

        if (current_location == trial.goal) {
            clickable = false;
            setTimeout(function() {
                display_congratulations();
                setTimeout(end_function, 2000); 
            }, 500);
        }

        return;
    }, true);

    // putting it all together

    function draw_current_room(current_location) {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        var room_color = trial.room_assignment[current_location];
        draw.fillStyle = room_color;
        draw.fillRect(0, 0, canvas.width, canvas.height);
        draw_door(0, 0.25*Math.PI); draw_door(1);
    }

    ////// End room stuff /////////////////////////////////////////////////////////
    
    function end_function() {

      display_element.html('');

      var trial_data = {
        "location_history": JSON.stringify(location_history),
        "action_history": JSON.stringify(action_history),
        "room_rts": JSON.stringify(room_rts),
        "total_rt": (new Date()).getTime() - start_time
      };

      jsPsych.finishTrial(trial_data);
    }

    draw_current_room(current_location);

  };

  return plugin;
})();
