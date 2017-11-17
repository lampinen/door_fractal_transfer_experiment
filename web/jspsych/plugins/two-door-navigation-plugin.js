// two-door-navigation-plugin 
// adapted from jspych demons

jsPsych.plugins['two-door-navigation'] = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {

    // expected parameters:
    //trial.group = the group
    //trial.room_assignment = assignment of room colors to elements
    //trial.door_color_assignment = assignment of colors white and black to left and right doors, resp. 
    //trial.door_position_assignment = assignment of door positions to generators (should be [0, 1] or [1, 0])
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


    display_element.append('<div id="instruction-div">'+''+'<br /><br /></div>');

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

    function draw_door(door_loc) {
        var door_color = trial.door_color_assignment[door_loc];
        var curr_door_loc = 0;
        if (door_loc == 0) {
            curr_door_loc = left_door_loc; 
        } else {
            curr_door_loc = right_door_loc; 
        }
        
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
    }
    

    // Room event handlers

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

    // putting it all together

    function draw_current_room(current_location) {
        var room_color = trial.room_assignment[current_location];
        draw.fillStyle = room_color;
        draw.fillRect(0, 0, canvas.width, canvas.height);
        draw_door(0); draw_door(1);
    }

    ////// End room stuff /////////////////////////////////////////////////////////
    
    function endTrial() {

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
