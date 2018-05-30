// plugin for dragging images onto locations on another image 

jsPsych.plugins['drag-drop-clustering'] = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {
    // Python-like range runction
    function range(n) {
        var result = [];
        for (i = 0; i < n; i++) {
            result.push(i);
        }
        return result;
    }


    // expected parameters:
    //trial.dragging_images = assignment of fractals to elements
    trial.canvas_height = trial.canvas_height || 400;
    trial.canvas_width = trial.canvas_width || 600;
    trial.dragging_image_height = trial.dragging_image_height || 80;
    trial.dragging_image_width = trial.dragging_image_width || 80;
    trial.instruction_text = trial.instruction_text || ""; 
    trial.snap_padding = (typeof trial.snap_padding === 'undefined') ? 10 : trial.snap_padding; //how generous snapping is, in pixels.


    var frame_freq = 50; // ms between frames

    display_element.append($('<canvas>', {
        "id": "dragging-canvas",
        "class": "dragging-canvas",
        "style": "border:1px solid #000000;",
        "css": {
            "position": "relative",
            "width": trial.canvas_width,
            "height": trial.canvas_height
        }
    }).width(trial.canvas_width).height(trial.canvas_height));
    $('#dragging-canvas')[0].width = trial.canvas_width;
    $('#dragging-canvas')[0].height = trial.canvas_height;

    var dragging_image_objects = trial.dragging_images.map(function(x) {
        var this_image = new Image(trial.dragging_image_width, trial.dragging_image_height);
        this_image.src = x;
        return this_image;
        });

    var canvas = $('#dragging-canvas')[0];
    var draw = canvas.getContext("2d");

    display_element.append('<div id="instruction-div">' + trial.instruction_text + '</div>');
    display_element.append("<br /><br /><button id='drag-drop-submit-btn' class='jspsych-btn'>Submit answers</button></div>");


    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    var action_history = [];

    var start_time = (new Date()).getTime();

    if (trial.dragging_images.length > 10) {
        alert("Not enough initial locations, truncating to 10 images...")
        dragging_image_objects = dragging_image_objects.slice(0,10);
    }

    var initial_locations = [{"x": 0, "y": 0, "width": 80, "height": 80}, {"x": 80, "y": 0, "width": 80, "height": 80},
                             {"x": 0, "y": 80, "width": 80, "height": 80}, {"x": 80, "y": 80, "width": 80, "height": 80},
                             {"x": 0, "y": 160, "width": 80, "height": 80}, {"x": 80, "y": 160, "width": 80, "height": 80},
                             {"x": 0, "y": 240, "width": 80, "height": 80}, {"x": 80, "y": 240, "width": 80, "height": 80},
                             {"x": 0, "y": 320, "width": 80, "height": 80}, {"x": 80, "y": 320, "width": 80, "height": 80}] //remember, you can't trust Marissa 
    initial_locations = initial_locations.slice(0, dragging_image_objects.length);

    /////// the annoying part ////////////////////////////////////////////////////

    // "constructor" for the places the objects snap to 
    var snap_padding = trial.snap_padding; //pixels
    function snap_location(this_location) {
        this.x = this_location.x;
        this.y = this_location.y;
        this.width = this_location.width || trial.dragging_image_width;
        this.height = this_location.height || trial.dragging_image_height;
        this.occupied = false;
        this.draggable = null;

        this.contains = function(mouse) {
            var x = mouse.x;
            var y = mouse.y;
            return (x >= this.x - snap_padding) && (x <= this.x + this.width + snap_padding) && (y >= this.y - snap_padding) && (y <= this.y + this.width + snap_padding);
        }

        this.free = function() {
            this.occupied = false;
        };

        this.assign_draggable = function(draggable) {
            this.occupied = true;
            this.draggable = draggable;
            this.draggable.curr_location = this;
            this.draggable.position_x = this.x;
            this.draggable.position_y = this.y;
        }
    }

    // creating objects for all the necessary locations
    initial_locations = initial_locations.map(function(x) {var loc = new snap_location(x); return loc;});
    var all_locations = initial_locations;

    // "constructor" for draggable image object
    function Draggable(image, initial_location, label, width, height) {
        this.drawer = draw; // it would be so nice if I named things intelligently
        this.curr_location = initial_location;
        this.position_x = initial_location.x; //not strictly necessary given below
        this.position_y = initial_location.y;
        this.curr_location.assign_draggable(this);

        this.label = label || image.src;
        this.image = image;
        this.width = width || trial.dragging_image_width;
        this.height = height || trial.dragging_image_height;
        this.dragging = false;
        this.drag_init_x = 0; //while dragging
        this.drag_init_y = 0;
        this.mouse_init_x = 0; //while dragging
        this.mouse_init_y = 0;
        this.draw = function() {
            this.drawer.drawImage(this.image,
                           this.position_x,
                           this.position_y,
                           this.width,
                           this.height);
        };

        this.contains = function(mouse) {
            var x = mouse.x;
            var y = mouse.y;
            return (x >= this.position_x) && (x <= this.position_x + this.width) && (y >= this.position_y) && (y <= this.position_y + this.width)
        }
        
        this.mousedown_handler = function(e, mouse) {
            // presupposes containment
            this.dragging = true; 
            this.drag_init_x = this.position_x;
            this.drag_init_y = this.position_y;
            this.mouse_init_x = mouse.x; 
            this.mouse_init_y = mouse.y;
        }

        this.mousemove_handler = function(e, mouse) {
            this.position_x = this.drag_init_x + mouse.x - this.mouse_init_x;
            this.position_y = this.drag_init_y + mouse.y - this.mouse_init_y;
        }

        this.mouseup_handler = function(e, mouse) {
            this.dragging = false; 
            for (var i = 0; i < all_locations.length; i++ ) {
                if (all_locations[i].contains(mouse)) {
                    if (this.curr_location) {
                        if (all_locations[i].occupied) {
                            this.curr_location.assign_draggable(all_locations[i].draggable);
                        } else {
                            this.curr_location.free();
                        }
                    }
                    all_locations[i].assign_draggable(this);
                    return;
                } else {
                    if (this.curr_location) {
                        this.curr_location.free();
                        this.curr_location = null;
                    }
                }
            }
        }
    }

    var draggables_array = []; 
    for (var i = 0; i < trial.dragging_images.length; i++) {
        var this_draggable = new Draggable(dragging_image_objects[i], initial_locations[i], trial.dragging_images[i]);
        draggables_array.push(this_draggable);
        if (trial.preplaced_image !== "" && this_draggable.label == trial.preplaced_image) { // first one placed to make it easier for old fogeys like Yochai
            this_draggable.curr_location.free();
            target_locations[trial.preplaced_image_location].assign_draggable(this_draggable); 
        }
    }

    function any_targets_unoccupied() { // checks for completion
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].position_x < 160) {
                return true;
            }
        }
        return false; 
    }

    function get_current_assignments() {
        var curr_assignments = [];
        for (var i = 0; i < draggables_array.length; i++) {
            curr_assignments.push([draggables_array[i].position_x, draggables_array[i].position_y]);
        }
        return curr_assignments;
    }

    function redraw() {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        draw.fillStyle = "#E0E0E0";
        draw.fillRect(160, 0, canvas.width, canvas.height);

        var currently_dragging = -1;
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].dragging) {
                currently_dragging = i;
            } else { 
                draggables_array[i].draw();
            }
        }
        if (currently_dragging !== -1) {
            draggables_array[currently_dragging].draw();
        }
    }
    ////// event stuff /////////////////////////////

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

    canvas.addEventListener('mousedown', function(e) {
        var mouse = getMouse(e, canvas);
        //alert([mouse.x, mouse.y]) //Useful for finding locations...
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].contains(mouse)) {
                return draggables_array[i].mousedown_handler(e, mouse);
            }
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        var mouse = getMouse(e, canvas);
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].dragging) {
                return draggables_array[i].mousemove_handler(e, mouse);
            }
        }
    });

    canvas.addEventListener('mouseup', function(e) {
        var mouse = getMouse(e, canvas);
        for (var i = 0; i < draggables_array.length; i++) {
            if (draggables_array[i].dragging) {
                return draggables_array[i].mouseup_handler(e, mouse);
            }
        }
    });

    ////// Ending/starting /////////////////////////////////////////////////////////
    
    function end_function() {
        if (any_targets_unoccupied()) {
            alert("Please place every image on the right side of the display!");
            return;
        }
        display_element.html('');

        var trial_data = {
            "rt": (new Date()).getTime() - start_time,
            "assignments": get_current_assignments() 
        };
        alert(JSON.stringify(trial_data))

        jsPsych.finishTrial(trial_data);
    }

    // start trial once images are loaded
    jsPsych.pluginAPI.preloadImages(trial.dragging_images.concat([trial.background_image]), function() {
	$('#drag-drop-submit-btn').on('click', end_function);
        setInterval(redraw, frame_freq);
    });
  };

  return plugin;
})();
