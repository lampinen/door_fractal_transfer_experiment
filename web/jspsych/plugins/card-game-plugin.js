// two-door-navigation-plugin 
// adapted from jspych demons

jsPsych.plugins['card-game'] = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {

    // expected parameters:
    //trial.group = the group
    //trial.card_assignment = assignment of opponents card symbols to elements
    //trial.pattern_generator_assignment = assignment of player card patterns to generators (should be [0, 1] or [1, 0])
    //trial.goal = one of group.elements
    //trial.start = one of group.elements
    //optional: trial.progress, update of progress bar after
    trial.action_noise = (typeof trial.action_noise === 'undefined') ? 0.0 : trial.action_noise; // how often an action "misses"
    trial.canvas_height = trial.canvas_height || 400;
    trial.canvas_width = trial.canvas_width || 600;
    var patterns = ['dots', 'stripes'];
    patterns = [patterns[trial.pattern_generator_assignment[0]], patterns[trial.pattern_generator_assignment[1]]];

    //hacky p-bar update but I don't want to change to jspsych 6
    if (typeof trial.progress !== 'undefined') {
      $('body').prepend($('<div id="jspsych-progressbar-container"><span>Spatial experiment progress</span><div id="jspsych-progressbar-outer"><div id="jspsych-progressbar-inner"></div></div></div>')); 
      $('#jspsych-progressbar-inner').css('width', trial.progress + "%");
    }

    display_element.append($('<canvas>', {
        "id": "card-game-canvas",
        "class": "card-game-canvas",
        "style": "border:1px solid #000000;",
        "css": {
            "position": "relative",
            "width": trial.canvas_width,
            "height": trial.canvas_height
        }
    }).width(trial.canvas_width).height(trial.canvas_height));
    $('#card-game-canvas')[0].width = trial.canvas_width;
    $('#card-game-canvas')[0].height = trial.canvas_height;

    var canvas = $('#card-game-canvas')[0];
    var draw = canvas.getContext("2d");


    display_element.append('<div id="instruction-div">Get the other player to show the target card.<br /><br /></div>');

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    var current_location = trial.start;

    var location_history = [];
    location_history.push(current_location);

    var action_history = [];
    var click_history = []; // redundant but nevertheless may be informative if there is e.g. a L-R click bias

    var location_rts = [];

    var start_time = (new Date()).getTime();

    var this_card_time = start_time;

    /////// Game graphics ////////////////////////////////////////////////////
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
    
    // horizontal 
    function draw_trapezoid_h(x, y, bottom_width, top_width, height) {
        draw.beginPath(); 
        draw.moveTo(x, y);
        draw.lineTo(x + bottom_width, y);
        draw.lineTo(x + (bottom_width + top_width) / 2, y - height);
        draw.lineTo(x + (bottom_width - top_width) / 2, y - height);
        draw.closePath();
    }

    var card_scale = 100;
    var pi = Math.PI;
    var two_pi = 2*pi;
    var pi_2 = pi/2;
    var pi_3 = pi/3;
    var pi_4 = pi/4;
    var pi_6 = pi/6;
    var shrink_constant = 0.3;
    function draw_card(x, y, scale, contents, angle, azimuth_angle, back_color) {
        angle = (typeof angle === 'undefined') ? 0 : angle;
        azimuth_angle = (typeof azimuth_angle === 'undefined') ? 0 : azimuth_angle;
        back_color = (typeof background === 'undefined') ?  "#6660FF" : background;
        var c_width = 0.4*scale; // + 2 cc_r
        var c_height = 0.8*scale; // + 2 cc_r
        var cc_r = 0.1*scale; //card corner radius

        var flip_scale_x = Math.cos(azimuth_angle);
        var front = flip_scale_x >= 0;
        if (!front) {
            flip_scale_x = -flip_scale_x;
        }
        var cc_rx = flip_scale_x * cc_r;
        var c_width_sc = flip_scale_x * c_width;
        // farther side of card needs to shrink for foreshortening
        var cc_ry = (1-(1-flip_scale_x) * shrink_constant) * cc_r;
        var c_height_sc = (1- (1-flip_scale_x) * shrink_constant) * c_height; 
        var offset_y = (c_height + cc_r + cc_r - (c_height_sc + cc_ry + cc_ry))*0.5;



        draw.translate(x, y);
        draw.rotate(angle);


        if (front) {
            draw.beginPath();
            draw.moveTo(0, cc_r);
            draw.ellipse( cc_rx, cc_r, cc_rx, cc_r, 0, -pi, -pi_2);
            draw.lineTo( cc_rx + c_width_sc, offset_y);
            draw.ellipse( cc_rx + c_width_sc, offset_y + cc_ry, cc_rx, cc_ry, 0, -pi_2, 0);
            draw.lineTo( cc_rx + cc_rx + c_width_sc, offset_y + cc_ry + c_height_sc);
            draw.ellipse( cc_rx + c_width_sc, offset_y + cc_ry + c_height_sc, cc_rx, cc_ry, 0, 0, pi_2);
            draw.lineTo( cc_rx , cc_r + cc_r + c_height);
            draw.ellipse( cc_rx , cc_r + c_height, cc_rx, cc_r, 0, pi_2, pi);
            draw.closePath();
            draw.fillStyle = "White";
            draw.strokeStyle = "Black";
            draw.fill();
            draw.stroke();

            //NOTE: symbols assume azimuth angle is zero (except for patterns)
            var c_full_width = c_width_sc + cc_rx + cc_rx;
            var c_full_height = c_height + cc_r + cc_r;
            var s_size  = 0.8 * c_full_width;
            if (contents === "square") {
                s_size = 0.7 * c_full_width;
            }
            var s_off_x = (c_full_width - s_size) * 0.5;
            var s_off_y = (c_full_height - s_size) * 0.5;


            switch(contents) {
                case "triangle":
                    draw.beginPath()
                    draw.moveTo(s_off_x, s_off_y + s_size);
                    draw.lineTo(s_off_x + s_size * 0.5, s_off_y);
                    draw.lineTo(s_off_x + s_size, s_off_y + s_size);
                    draw.closePath();
                    draw.fillStyle = "Black";
                    draw.fill();
                    break;
                case "square":
                    draw.beginPath()
                    draw.moveTo(s_off_x, s_off_y);
                    draw.lineTo(s_off_x + s_size, s_off_y);
                    draw.lineTo(s_off_x + s_size, s_off_y + s_size);
                    draw.lineTo(s_off_x, s_off_y + s_size);
                    draw.closePath();
                    draw.fillStyle = "Black";
                    draw.fill();
                    break;
                case "circle":
                    var s_r = 0.5 * s_size;
                    draw.beginPath()
                    draw.arc(s_off_x + s_r, s_off_y + s_r, s_r, 0, two_pi);
                    draw.closePath();
                    draw.fillStyle = "Black";
                    draw.fill();
                    break;
                case "diamond":
                    draw.beginPath()
                    draw.moveTo(s_off_x, s_off_y + 0.5*s_size);
                    draw.lineTo(s_off_x + s_size * 0.5, s_off_y);
                    draw.lineTo(s_off_x + s_size, s_off_y + 0.5*s_size);
                    draw.lineTo(s_off_x + s_size * 0.5, s_off_y + s_size);
                    draw.closePath();
                    draw.fillStyle = "Black";
                    draw.fill();
                    break;
                case "moon":
                    s_off_x = 0.3 * s_off_x;
                    var s_r = 0.5 * s_size;
                    var s_r_2 = 0.33 * s_size;
                    draw.beginPath()
                    draw.arc(s_off_x + s_r, s_off_y + s_r, s_r, -2*pi_3, 2*pi_3);
                    draw.arc(s_off_x, s_off_y + s_r, s_r, pi_3, -pi_3, true);
                    draw.closePath();
                    draw.fillStyle = "Black";
                    draw.fill();
                    break;
                case "squiggle":
                    var s_r = 0.25 * s_size;
                    draw.beginPath()
                    draw.arc(s_off_x + 2*s_r, s_off_y + s_r, s_r, pi_6 -pi, pi_2);
                    draw.arc(s_off_x + 2*s_r, s_off_y + 3*s_r, s_r, -pi_2, pi_6, true);
                    draw.strokeStyle = "Black";
                    draw.lineWidth = 0.1*scale;
                    draw.stroke();
                    draw.lineWidth = 1;
                    break;
                case "lightning":
                    s_off_x = 1.75* s_off_x;
                    draw.beginPath()
                    draw.moveTo(s_off_x + 0.25 * s_size, s_off_y);
                    draw.lineTo(s_off_x + 0.55*s_size, s_off_y);
                    draw.lineTo(s_off_x + 0.4*s_size, s_off_y + 0.4 * s_size);
                    draw.lineTo(s_off_x + 0.7*s_size, s_off_y + 0.4 * s_size);
                    draw.lineTo(s_off_x + 0.3*s_size, s_off_y + 1.1* s_size);
                    draw.lineTo(s_off_x + 0.35*s_size, s_off_y + 0.6* s_size);
                    draw.lineTo(s_off_x+0.15*s_size, s_off_y + 0.6* s_size);
                    draw.closePath();
                    draw.fillStyle = "Black";
                    draw.fill();
                    break;
                case "plus":
                    var half_size = 0.5 * s_size;
                    draw.beginPath()
                    draw.moveTo(s_off_x, s_off_y + half_size);
                    draw.lineTo(s_off_x + s_size, s_off_y + half_size);
                    draw.moveTo(s_off_x + half_size, s_off_y );
                    draw.lineTo(s_off_x + half_size, s_off_y + s_size);
                    draw.strokeStyle = "Black";
                    draw.lineWidth = 0.1*scale;
                    draw.stroke();
                    draw.lineWidth = 1;
                    break;
                case "dots":
                    var dot_rx = 0.1 * c_full_width;
                    var widths = [0.2 * c_full_width, 0.5 * c_full_width, 0.8 * c_full_width];
                    var width_scales = [0.2, 0.5, 0.8];
                    var c_full_height = c_height + cc_r + cc_r;
                    var this_height_sc; 
                    var this_offset_y;
                    var dot_ry;
                    draw.fillStyle = "Black";
                    var locs = [0.25, 0.5, 0.75];
                    for (var width_i = 0; width_i < 3; width_i++) {
                        this_height_sc = (1- width_scales[width_i] *(1-flip_scale_x) * shrink_constant) * c_full_height; 
                        this_offset_y = (c_full_height - this_height_sc) * 0.5;
                        dot_ry = 0.06 * this_height_sc;
                        for (var loc_i = 0; loc_i < 3; loc_i++) { 
                            draw.beginPath();
                            draw.ellipse(widths[width_i], this_offset_y + locs[loc_i] * this_height_sc, dot_rx, dot_ry, 0, 0, two_pi);
                            draw.closePath();
                            draw.fill();
                        }
                    }
                    
                    break;
                case "stripes":
                    var line_half_width = 0.1 * c_full_width;
                    var width_1 = 0.3 * c_full_width;
                    var width_2 = 0.7 * c_full_width;
                    var c_full_height = c_height + cc_r + cc_r;
                    var this_height_sc = (1- 0.2 *(1-flip_scale_x) * shrink_constant) * c_full_height; 
                    var this_offset_y = (c_full_height - this_height_sc) * 0.5;
                    draw.fillStyle = "Black";
                    draw.beginPath();
                    draw.moveTo(width_1-line_half_width, this_offset_y);
                    draw.lineTo(width_1-line_half_width, this_offset_y + this_height_sc);
                    this_height_sc = (1- 0.4 *(1-flip_scale_x) * shrink_constant) * c_full_height; 
                    this_offset_y = (c_full_height - this_height_sc) * 0.5;
                    draw.lineTo(width_1+line_half_width, this_offset_y + this_height_sc);
                    draw.lineTo(width_1+line_half_width, this_offset_y);
                    draw.closePath();
                    draw.fill();
                    this_height_sc = (1- 0.6 *(1-flip_scale_x) * shrink_constant) * c_full_height; 
                    this_offset_y = (c_full_height - this_height_sc) * 0.5;
                    draw.beginPath();
                    draw.moveTo(width_2-line_half_width, this_offset_y);
                    draw.lineTo(width_2-line_half_width, this_offset_y + this_height_sc);
                    this_height_sc = (1- 0.8 *(1-flip_scale_x) * shrink_constant) * c_full_height; 
                    this_offset_y = (c_full_height - this_height_sc) * 0.5;
                    draw.lineTo(width_2+line_half_width, this_offset_y + this_height_sc);
                    draw.lineTo(width_2+line_half_width, this_offset_y);
                    draw.closePath();
                    draw.fill();
                    break;

            }
        } else {
            draw.beginPath();
            draw.ellipse( cc_rx, offset_y + cc_ry, cc_rx, cc_ry, 0, -pi, -pi_2);
            draw.lineTo( cc_rx + c_width_sc, 0);
            draw.ellipse( cc_rx + c_width_sc, cc_r, cc_rx, cc_r, 0, -pi_2, 0);
            draw.lineTo( cc_rx + cc_rx + c_width_sc, cc_r + c_height);
            draw.ellipse( cc_rx + c_width_sc, cc_r + c_height, cc_rx, cc_r, 0, 0, pi_2);
            draw.lineTo( cc_rx , offset_y + cc_ry + cc_ry + c_height_sc);
            draw.ellipse( cc_rx , offset_y + cc_ry + c_height_sc, cc_rx, cc_ry, 0, pi_2, pi);
            draw.closePath();
            draw.fillStyle = back_color;
            draw.strokeStyle = "Black";
            draw.fill();
            draw.stroke();
        }

        draw.rotate(-angle);
        draw.translate(-x, -y);
    }


    var o_r = 80;
    var o_hand_r = 15;
    var o_eye_r = 8;
    function draw_opponent() {
        draw.fillStyle = "#EEEE00";
        draw.strokeStyle = "Black";
        draw.lineWidth = 3;
        draw.beginPath();
        draw.arc(canvas.width/2, canvas.height/3, o_r, 0, two_pi);
        draw.closePath()
        draw.fill();
        draw.stroke();

        draw.lineWidth = 2;
        draw.beginPath();
        draw.arc(400, 250, o_hand_r, 0, two_pi);
        draw.closePath()
        draw.fill();
        draw.stroke();

        //smile
        draw.beginPath();
        draw.arc(canvas.width/2, canvas.height/3-0.4*o_r, o_r, pi_4, pi_4+pi_2);
        draw.stroke();


        //eyes 
        draw.fillStyle = "Black";
        draw.beginPath();
        draw.arc(canvas.width/2 + 0.4 *o_r, canvas.height/3-0.4*o_r, o_eye_r, 0, two_pi);
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.arc(canvas.width/2 - 0.4 *o_r, canvas.height/3-0.4*o_r, o_eye_r, 0, two_pi);
        draw.fill();
        draw.stroke();

        //reset
        draw.lineWidth = 1;
    }

    function draw_card_table() {
        draw.fillStyle = "SaddleBrown";
        draw.strokeStyle = "Black";
   	draw.rect(30, 350, 25, 50); 
        draw.fill();
        draw.stroke();
   	draw.rect(55, 350, 10, 50); 
        draw.fill();
        draw.stroke();

        draw.beginPath();
   	draw.rect(545, 350, 25, 50); 
        draw.closePath();
        draw.fill();
        draw.stroke();
        draw.beginPath();
   	draw.rect(535, 350, 10, 50); 
        draw.closePath();
        draw.fill();
        draw.stroke();

        draw.fillStyle = "#6B3503";

        draw.beginPath();
   	draw.rect(150, 270, 20, 150); 
        draw.closePath();
        draw.fill();
        draw.stroke();
        draw.beginPath();
   	draw.rect(170, 270, 8, 150); 
        draw.closePath();
        draw.fill();
        draw.stroke();

        draw.beginPath();
   	draw.rect(430, 270, 20, 150); 
        draw.closePath();
        draw.fill();
        draw.stroke();
        draw.beginPath();
   	draw.rect(422, 270, 8, 150); 
        draw.closePath();
        draw.fill();
        draw.stroke();

        draw.fillStyle = "SaddleBrown";
        draw_trapezoid_h(20, 350, 560, 300, 80);
        draw.fill();
        draw.stroke();
        draw.beginPath();
        draw.rect(20, 350, 560, 10);
        draw.closePath();
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


    function card_contains(card_loc,x,y) { //Returns whether (x,y) on the canvas is 'within' the card 
        if (card_loc == 0) {
            curr_card_loc = left_card_loc; 
        } else {
            curr_card_loc = right_card_loc; 
        }
        return x >= curr_card_loc && x <= curr_card_loc + card_width && y >= card_offset && y <= card_offset + card_height; 
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

    function next_card(current_location, action) {
        if (Math.random() < trial.action_noise) {
            action = 1 - action;
        }
        var generators = trial.group.get_some_generators()
        new_location = trial.group.operation(current_location, generators[action]); 
        return new_location;
    }


    function get_percentile_string(start, goal, num_steps) {
        var quants = trial.group.distributions[start][goal];
        var pct = 10;
        if (num_steps <= quants.X90) {
            pct = 90;
        } else if (num_steps <= quants.X80) {
            pct = 80;
        } else if (num_steps <= quants.X70) {
            pct = 70;
        } else if (num_steps <= quants.X60) {
            pct = 60;
        } else if (num_steps <= quants.X50) {
            pct = 50;
        } else if (num_steps <= quants.X40) {
            pct = 40;
        } else if (num_steps <= quants.X30) {
            pct = 30;
        } else if (num_steps <= quants.X20) {
            pct = 20;
        }

        if (pct == 90) { 
            return ["Congratulations!", "You did it in the minimum number of plays!"];
        } else if (pct > 50) { 
            return ["Pretty good!", "But you could have done even better."];
        } else {
            return ["You did it.", "But you could have done it much quicker."];
        }

    }

//    var cent_sign = String.fromCharCode(parseInt('00A2', 16));
//    var earning_string = "+4" + cent_sign;
    var num_steps;
    function display_congratulations() {
        // reduce opacity of background
        draw.globalAlpha = 0.9;
        draw.fillStyle = "gray";
        draw.fillRect(0, 0, canvas.width, canvas.height);

        draw.globalAlpha = 1;
        draw.textAlign = "center";
        draw.fillStyle = "white";
        var achievement_strings = get_percentile_string(trial.start, trial.goal, num_steps);
        draw.font = "40px Arial";
        draw.fillText(achievement_strings[0], canvas.width/2, canvas.height/2);
        draw.font = "25px Arial";
        draw.fillText(achievement_strings[1], canvas.width/2, canvas.height/2 + 75);

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
        location_rts.push(curr_time - this_card_time);
        click_history.push(door_loc);
        var this_action = trial.door_generator_assignment[door_loc]; 
        current_location = next_card(current_location, this_action);
        action_history.push(this_action); 

        // animate
        clickable = false;
        animate_door_opening(door_loc, function() {
            draw_current_card(current_location);
            location_history.push(current_location);
            this_card_time = (new Date()).getTime();

            if (current_location == trial.goal) {
                setTimeout(function() {
                    num_steps = click_history.length;
                    display_congratulations();
                    setTimeout(end_function, 2500); 
                }, 500);
            } else {
                clickable = true;
            }
        })

        return;
    }, true);

    // putting it all together

    function draw_current_cards(current_location, goal_location) {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        var card_contents = trial.card_assignment[current_location];
        var target_contents = trial.card_assignment[goal_location];

        draw_card_table();

        //target 
        draw.fillStyle = "Black";
        draw.font = "20px Arial";
        draw.fillText("Target:", 10, 25);
        draw_card(10, 35, card_scale, target_contents);

        // opponent +  card
        draw_opponent();
        draw_card(370, 150, card_scale, card_contents);

        //own cards
        draw_card(157, 300, card_scale*1.4, patterns[0], -pi_6, 0);
        draw_card(363, 260, card_scale*1.4, patterns[1], pi_6, 0);
    }

    ////// End card stuff /////////////////////////////////////////////////////////

    
    function end_function() {

      display_element.html('');

      var trial_data = {
        "group": trial.group.get_name(),
        "card_assignment": trial.card_assignment,
        "door_color_assignment": trial.door_color_assignment,
        "door_generator_assignment": trial.door_generator_assignment,
        "goal": trial.goal,
        "start": trial.start,
        "action_noise": trial.action_noise,
        "location_history": JSON.stringify(location_history),
        "action_history": JSON.stringify(action_history),
        "click_history": JSON.stringify(click_history),
        "location_rts": JSON.stringify(location_rts)
      };

      jsPsych.finishTrial(trial_data);
    }


    draw_current_cards(current_location, trial.goal);
    clickable = true;

  };

  return plugin;
})();
