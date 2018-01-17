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
    trial.action_noise = trial.action_noise || 0.15; // how often an action "misses"
    trial.canvas_height = trial.canvas_height || 400;
    trial.canvas_width = trial.canvas_width || 600;
    trial.image_height = trial.image_height || 300;
    trial.image_width = trial.image_width || 300;

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

    var image_objects = trial.fractal_assignment.map(function(x) {
        var this_image = new Image(trial.image_width, trial.image_height);
        this_image.src = x;
        return this_image;
        });

    var canvas = $('#mutation-canvas')[0];
    var draw = canvas.getContext("2d");

    display_element.append('<div id="instruction-div">Remember, press the \'a\' key to use acid, and \'g\' to use the gamma ray.<br /><br /></div>');

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    var current_location = trial.start;

    var location_history = [];
    location_history.push(current_location);

    var action_history = [];
    var mutagen_history = []; // redundant but nevertheless may be informative if there is e.g. a L-R click bias

    var location_rts = [];

    var start_time = (new Date()).getTime();

    var this_location_time = start_time;

    /////// graphics ////////////////////////////////////////////////////

    // global size parameters
    var ef_size = 125;
    var gr_size = 125;

    // all relative to size parameter 
    var ef_bot_width = 0.75;
    var ef_top_width = 0.2;
    var ef_height = 1;
    var ef_neck_length = 0.4; 
    var ef_bottom_curve = 0.1;
    var ef_grad_width = 0.15;
    var ef_x_pad = 0.2;
    var tube_width = 0.1;
    var tube_bend_start = 0.1;
    var tube_bend_radius = 0.25;
    var tube_bend_angle = -0.25 * Math.PI;
    var tube_bend_fudge = -0.05; // slop to make bezier curve tube approx. same width throughout
    var tube_2_len = 0.7;
    
    // to hold drop location
    var drop_x, drop_y;
    
    function draw_erlenmeyer(x, y, size) {
        x = x + size * ef_x_pad; //because I'm lazy 
        var ef_height_exclusive = ef_height - 2 * ef_bottom_curve; //conservative 
        var ef_slope_height = (ef_height_exclusive - ef_neck_length);
        var phi = Math.atan(ef_slope_height / (( ef_bot_width-ef_top_width) / 2)); 
        var cos_phi = Math.cos(phi);
        var sin_phi = Math.sin(phi);
        
        // tube stuff
        var cos_theta = Math.cos(tube_bend_angle);
        var sin_theta = Math.sin(tube_bend_angle);
        draw.beginPath()
        draw.fillStyle = "#151515";
        draw.moveTo(x + size * (ef_bot_width - tube_width) / 2, y + size * ef_height_exclusive);
        draw.lineTo(x + size * (ef_bot_width - tube_width) / 2, y - size * tube_bend_start);
        draw.bezierCurveTo(x + size * (ef_bot_width - tube_width) / 2, y - size * (tube_bend_start + tube_bend_radius + tube_width),
                           x + size * ((ef_bot_width - tube_width) / 2 + (1 + cos_theta + sin_theta) * (tube_bend_radius + tube_width)), y - size * (tube_bend_start + tube_bend_radius + tube_width + (sin_theta + cos_theta) * (tube_bend_radius + tube_width)),
                           x + size * ((ef_bot_width - tube_width) / 2 + (1 + cos_theta) * (tube_bend_radius + tube_width)), y - size * (tube_bend_start + tube_bend_radius + tube_width + sin_theta * (tube_bend_radius + tube_width)));

        draw.lineTo(x + size * ((ef_bot_width - tube_width) / 2 + (1 + cos_theta) * (tube_bend_radius + tube_width) - sin_theta * tube_2_len), y - size * (tube_bend_start + tube_bend_radius + tube_width + sin_theta * (tube_bend_radius + tube_width) - cos_theta * tube_2_len));
        drop_x = x + size * ((ef_bot_width - tube_width) / 2 + (1 + cos_theta) * (tube_bend_radius + tube_width) - cos_theta * 0.5 * tube_width - sin_theta * tube_2_len),
        drop_y = y - size * (tube_bend_start + tube_bend_radius + tube_width + sin_theta * (tube_bend_radius + 1.5 * tube_width) -cos_theta * tube_2_len);


        draw.lineTo(x + size * ((ef_bot_width - tube_width) / 2 + (1 + cos_theta) * (tube_bend_radius + tube_width) - cos_theta * tube_width - sin_theta * tube_2_len), y - size * (tube_bend_start + tube_bend_radius + tube_width + sin_theta * (tube_bend_radius + 2 * tube_width) -cos_theta * tube_2_len));


        draw.lineTo(x + size * ((ef_bot_width - tube_width) / 2 + (1 + cos_theta) * (tube_bend_radius + tube_width) - cos_theta * tube_width), y - size * (tube_bend_start + tube_bend_radius + tube_width + sin_theta * (tube_bend_radius + 2 * tube_width)));
        draw.bezierCurveTo(x + size * ((ef_bot_width - tube_width) / 2 + (1 + cos_theta + sin_theta) * (tube_bend_radius)), y - size * (tube_bend_start + tube_bend_radius +  (sin_theta + cos_theta) * (tube_bend_radius)),
                           x + size * (ef_bot_width + tube_width) / 2, y - size * (tube_bend_start + tube_bend_radius + tube_bend_fudge),
                           x + size * (tube_width + ef_bot_width) / 2, y - size * tube_bend_start);
        draw.lineTo(x + size * (tube_width + ef_bot_width) / 2, y + size * ef_height_exclusive);
        draw.closePath();
        draw.fill();

        // flask stuff

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
        draw.globalAlpha = 0.7;
        draw.fillStyle = "Red"; 
        draw.fill();
        
        draw.globalAlpha = 0.3;
        var draw_bubble = function(x, y, r, lw) {
            draw.beginPath();
            draw.arc(x, y, r, 0, 2* Math.PI);
            draw.strokeStyle = "MistyRose";
            draw.lineWidth = lw;
            draw.stroke();
        };

        draw_bubble(x + 0.33 * ef_bot_width * size, y + size * (ef_height_exclusive - 0.06), 0.015 * size, 1);
        draw_bubble(x + 0.42 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.02), 0.04 * size, 1);
        draw_bubble(x + 0.25 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.01), 0.025 * size, 1);
        draw_bubble(x + 0.2 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.09), 0.035 * size, 1);
        draw_bubble(x + 0.11 * ef_bot_width * size, y + size * (ef_height_exclusive - 0.02), 0.02 * size, 1);
        draw_bubble(x + 0.88 * ef_bot_width * size, y + size * (ef_height_exclusive - 0.03), 0.02 * size, 1);
        draw_bubble(x + 0.6 * ef_bot_width * size, y + size * (ef_height_exclusive - 0.03), 0.04 * size, 1);
        draw_bubble(x + 0.77 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.05), 0.025 * size, 1);
        draw_bubble(x + 0.93 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.07), 0.03 * size, 1);
        draw_bubble(x + 0.67 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.08), 0.02 * size, 1);
        draw_bubble(x + 0.53 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.06), 0.02 * size, 1);
        draw_bubble(x + 0.36 * ef_bot_width * size, y + size * (ef_height_exclusive + 0.1), 0.015 * size, 1);
        draw_bubble(x + 0.75 * ef_bot_width * size, y + size * (ef_height_exclusive - 0.07), 0.02 * size, 1);
        //TODO: draw bubbles
        ef_path();
        draw.globalAlpha = 0.3;
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

    function draw_drop(size) {
        draw.beginPath();
        draw.moveTo(drop_x, drop_y);
        draw.lineTo(drop_x, drop_y + size);
        draw.arcTo(drop_x, drop_y + 2 * size, drop_x + size, drop_y + 0.707 * size, 0.5 * size);
        draw.arcTo(drop_x + 2 * size, drop_y, drop_x, drop_y, 0.5 * size);

        draw.closePath()
        draw.globalAlpha = 0.7
        draw.fillStyle = "Red"; 
        draw.fill();
        draw.globalAlpha = 1;
    }

    var gamma_ray_1_rad = 0.2;
    var gamma_ray_2_rad = 0.15;
    var gamma_ray_3_rad = 0.1;
    var gamma_ray_rod_length = 0.15;
    var gamma_ray_rod_width = 0.075;

    var grb_start_x, grb_start_y, grb_theta, grb_size;

    // for animation
    function draw_gamma_ray(x, y, size, stage) {
        stage = stage || 0;
        grb_start_x = x;
        grb_start_y = y;
        grb_size = size;

        var theta = 0.18 * Math.PI;
        grb_theta = theta;
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
        if (stage === 1) {
            draw.fillStyle = "#AA00AA";
        } else {
            draw.fillStyle = "Silver";
        }
        draw.beginPath()
        draw.arc(0, 0, gamma_ray_1_rad * size, 0, 2 * Math.PI); 
        draw.fill();
        draw.stroke();
        if (stage === 2) {
            draw.fillStyle = "#DD33DD";
        } else {
            draw.fillStyle = "Silver";
        }
        draw.beginPath()
        draw.arc((gamma_ray_1_rad+gamma_ray_2_rad+gamma_ray_rod_length) * size, 0, gamma_ray_2_rad * size, 0, 2 * Math.PI); 
        draw.fill();
        draw.stroke();
        if (stage === 3) {
            draw.fillStyle = "#FF55FF";
        } else {
            draw.fillStyle = "Silver";
        }
        draw.beginPath()
        draw.arc((gamma_ray_1_rad+2 *gamma_ray_2_rad+ 2 * gamma_ray_rod_length + gamma_ray_3_rad) * size, 0, gamma_ray_3_rad * size, 0, 2 * Math.PI); 
        draw.fill();
        draw.stroke();
        draw.setTransform(1, 0, 0, 1, 0, 0);
    }



    var petri_dish_rad = 20;

    function draw_petri_dish(current_location, fillcenter_color) {
        draw.drawImage(image_objects[current_location],
                       (canvas.width - trial.image_width)/2,
                       (canvas.height - trial.image_width)/2,
                       trial.image_width,
                       trial.image_height); 
        var pd_path = function(stroke, fillcenter) {
            if (stroke) {
                draw.beginPath();
                draw.arc(canvas.width/2, canvas.height/2, petri_dish_rad+trial.image_width/2, 0, 2*Math.PI);
                draw.stroke();
                draw.beginPath();
                draw.arc(canvas.width/2, canvas.height/2, trial.image_width/2, 0, 2*Math.PI, true);
                draw.stroke();
            } else if (fillcenter) {
                draw.beginPath();
                draw.arc(canvas.width/2, canvas.height/2, trial.image_width/2, 0, 2*Math.PI, true);
                draw.fill();
            } else {
                draw.beginPath();
                draw.arc(canvas.width/2, canvas.height/2, petri_dish_rad+trial.image_width/2, 0, 2*Math.PI);
                draw.arc(canvas.width/2, canvas.height/2, trial.image_width/2, 0, 2*Math.PI, true);
                draw.fill();
            }
        };
        draw.globalAlpha = 0.3;
        draw.strokeStyle = "SlateGray";
        draw.lineWidth = 5;
        pd_path(true);
        draw.strokeStyle = "CadetBlue";
        draw.lineWidth = 2;
        pd_path(true);
        draw.globalAlpha = 1;
        draw.strokeStyle = "DarkSlateGray";
        draw.lineWidth = 1;
        pd_path(true);
        draw.globalAlpha = 0.2;
        draw.fillStyle = "LightBlue";
        pd_path(false);
        if (fillcenter_color) {
            draw.globalAlpha = 0.4;
            draw.fillStyle = fillcenter_color;
            pd_path(false, true);
        }
        draw.globalAlpha = 1;
    }
    
    var num_pages = 3;
    var page_offset = 0.02;
    var nb_ring_ry = 0.1;
    var nb_ring_rx = 0.05;
    var nb_ring_hole_r = 0.02;
    var nb_width = 0.85; // relative to size 
    var nb_length = 1.2; // ehhhh
    var num_lines = 9;
    var line_spacing = (nb_length - 2 * nb_ring_ry)/(1 + num_lines)
    var num_rings = 4;
    var ring_half_spacing = nb_width / (2 * (num_rings))
    var nb_image_size = 0.6
    var nb_tape_offset = 0.1;
    var nb_tape_width = 0.1;

    function draw_notebook(x, y, size, goal) {
        // pages
        draw.lineWidth = 1;
        draw.strokeStyle = "Black";
        draw.fillStyle = "LightYellow";
        for (var i = 0; i < num_pages; i++) {
            draw.beginPath();
            draw.rect(x + page_offset * i * size , y + (nb_ring_ry + page_offset * i) * size, size * nb_width, size * (nb_length - nb_ring_ry));
            draw.fill();
            draw.stroke();
        }

        // lines

        draw.strokeStyle = "LightBlue";
        for (var i = 1; i <= num_lines; i++) {
           draw.beginPath();
           draw.moveTo(x + page_offset * (num_pages - 1) * size , y + (2.5 * nb_ring_ry + line_spacing * i) * size);
           draw.lineTo(x + (page_offset * (num_pages - 1) + nb_width) * size , y + (2.5 * nb_ring_ry + line_spacing * i) * size);
           draw.stroke();
        }
        // rings 
        draw.lineWidth = 3;
        draw.strokeStyle = "Silver";
        var draw_ring = function(x) {
            draw.beginPath();
            draw.arc(x, y + 2 * nb_ring_ry * size, nb_ring_hole_r  * size, 0, 2*Math.PI);
            draw.fillStyle = "Black";
            draw.fill();
            draw.beginPath();
            draw.ellipse(x, y + nb_ring_ry * size, nb_ring_rx * size, nb_ring_ry  * size, 0, -Math.PI, 0.5*Math.PI);
            draw.stroke()
        };
        for (var i = 0; i < num_rings; i++) {
            draw_ring(x + size * (page_offset * num_pages/2 +  ring_half_spacing * (1 + 2 * i))); 
        }
        
        // text
        draw.lineWidth = 1;
        draw.font = "20px Helvetica";
        draw.fillStyle = "Black";
        draw.textAlign = "center";
        draw.fillText("Make this:", x + (page_offset * num_pages/2 + 0.5 * nb_width) *size, y + 4 * nb_ring_ry * size);

        // image
        draw.drawImage(image_objects[goal],
                       x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size)) *size,
                       y + (5.25 * nb_ring_ry) *size,
                       nb_image_size*size,
                       nb_image_size*size); 
        // tape
        draw.globalAlpha = 0.33;
        draw.fillStyle = "LightGray";
        draw.beginPath()
        draw.moveTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) - nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry + nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) + nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry - nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) + nb_tape_offset + 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry - nb_tape_offset + 0.71 * nb_tape_width) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) - nb_tape_offset + 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry + nb_tape_offset + 0.71 * nb_tape_width) *size);
        draw.closePath();
        draw.fill();
        draw.beginPath()
        draw.moveTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) - nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry - nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) + nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry + nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) + nb_tape_offset - 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry + nb_tape_offset + 0.71 * nb_tape_width) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) - nb_tape_offset - 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry - nb_tape_offset + 0.71 * nb_tape_width) *size);
        draw.closePath();
        draw.fill();
        draw.beginPath()
        draw.moveTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) - nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry  + nb_image_size - nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) + nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry + nb_image_size + nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) + nb_tape_offset + 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry + nb_image_size + nb_tape_offset - 0.71 * nb_tape_width) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width - nb_image_size) - nb_tape_offset + 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry + nb_image_size - nb_tape_offset - 0.71 * nb_tape_width) *size);
        draw.closePath();
        draw.fill();
        draw.beginPath()
        draw.moveTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) - nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry + nb_image_size + nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) + nb_tape_offset) *size,
                    y + (5.25 * nb_ring_ry + nb_image_size - nb_tape_offset) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) + nb_tape_offset - 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry + nb_image_size - nb_tape_offset - 0.71 * nb_tape_width) *size);
        draw.lineTo(x + (page_offset * num_pages/2 + 0.5 * (nb_width + nb_image_size) - nb_tape_offset - 0.71 * nb_tape_width) *size,
                    y + (5.25 * nb_ring_ry + nb_image_size + nb_tape_offset - 0.71 * nb_tape_width) *size);
        draw.closePath();
        draw.fill();
        draw.globalAlpha = 1;
    };

    // putting it all together

    function draw_current_setup(current_location, gamma_ray_stage, petri_dish_fill_color) {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        draw_petri_dish(current_location, petri_dish_fill_color);
        draw_erlenmeyer(-15, 50, ef_size);
        draw_gamma_ray(5, canvas.height - 5, gr_size, gamma_ray_stage);
        draw_notebook(canvas.width - 120, 125, 125, trial.goal);
    }

    // animation
    var animation_time = 500; //length of animation in ms
    var post_animation_delay = 500; // how long to wait on last frame
    var drop_step_size = 2;
    var num_frames = 20;
    var frame_time = animation_time/num_frames;


    function animate_drop(callback, remaining_frames) {
            if (remaining_frames === 0) {
                draw_current_setup(current_location, 0, "Red");
                setTimeout(callback, post_animation_delay);
                return;
            }
            remaining_frames = remaining_frames || num_frames;
            draw_current_setup(current_location);
            draw_drop(drop_step_size * (num_frames - remaining_frames))
            setTimeout(function() {
                animate_drop(callback, remaining_frames - 1); 
            }, frame_time);
    }

    var grb_width = 0.075;
    var grb_length = 1.5;
    function draw_grb(remaining_frames) {
        var grb_num_frames = 0.1 * num_frames;
        var step_size = grb_length / (grb_num_frames);
        var sin_theta = Math.sin(grb_theta);
        var cos_theta = Math.cos(grb_theta);
        draw.setTransform(cos_theta, -sin_theta, sin_theta, cos_theta, grb_start_x + gamma_ray_1_rad * grb_size, grb_start_y - gamma_ray_1_rad * grb_size);
        draw.beginPath()
        draw.moveTo((gamma_ray_1_rad+ 2 *gamma_ray_2_rad+ 2 *gamma_ray_rod_length + 2 * gamma_ray_3_rad) * grb_size, - grb_size * grb_width * 0.5); 
        draw.lineTo((gamma_ray_1_rad+ 2 *gamma_ray_2_rad+ 2 *gamma_ray_rod_length + 2 * gamma_ray_3_rad + step_size * (grb_num_frames - remaining_frames + 1)) * grb_size, - grb_size * grb_width *0.5); 
        draw.lineTo((gamma_ray_1_rad+ 2 *gamma_ray_2_rad+ 2 *gamma_ray_rod_length + 2 * gamma_ray_3_rad + step_size * (grb_num_frames - remaining_frames + 1)) * grb_size, + grb_size * grb_width *0.5); 
        draw.lineTo((gamma_ray_1_rad+ 2 *gamma_ray_2_rad+ 2 *gamma_ray_rod_length + 2 * gamma_ray_3_rad) * grb_size, + grb_size * grb_width *0.5); 
        draw.closePath();
        draw.fillStyle = "#FFBBFF";
        draw.fill();
        draw.setTransform(1, 0, 0, 1, 0, 0);
    }

    function animate_grb(callback, remaining_frames) {
            if (remaining_frames === 0) {
                draw_current_setup(current_location, 0, "Magenta");
                setTimeout(callback, post_animation_delay);
                return;
            }
            remaining_frames = remaining_frames || num_frames;
            draw_current_setup(current_location);
            if (remaining_frames > 0.7* num_frames) {
                draw_current_setup(current_location, 1);
            } else if (remaining_frames > 0.4 * num_frames) {
                draw_current_setup(current_location, 2);
            } else if (remaining_frames > 0.1 * num_frames) {
                draw_current_setup(current_location, 3);
            } else { 
                draw_current_setup(current_location);
                draw_grb(remaining_frames);
            }
 
            setTimeout(function() {
                animate_grb(callback, remaining_frames-1);
            }, frame_time);
    }

    function animate_mutation(mutagen_loc,  callback) {
        if (mutagen_loc === 0) { //liquid
            animate_drop(callback);
        } else { //ray
            animate_grb(callback);
        }
    }

    // Room event handlers

    function mutagen_contains(mutagen_loc,x,y) { //Returns whether (x,y) on the canvas is 'within' the mutagen 
        if (mutagen_loc == 0) { //Liquid
            return ((x < 0.9 * ef_size) && (y < 1.4 * ef_size)) || ((x < 1.5 * ef_size) && (y < 0.8 * ef_size))
        } else { //Ray
            return ((x < 0.5 * gr_size) && (y > canvas.height - 0.5 * gr_size)) || (((x < 1.15 * gr_size) && (x > 0.4*gr_size)) && ((y < canvas.height - 0.3 * gr_size)  && (y > canvas.height - 0.85 * gr_size)))
        }
        return false; 
    }

    var keyable = true;

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
        new_location = trial.group.operation(current_location, generators[action]); 
        return new_location;
    }

    function display_congratulations() {
        draw.clearRect(0, 0, canvas.width, canvas.height);
        draw.fillStyle = "White";
        draw.fillRect(0, 0, canvas.width, canvas.height);
        draw.fillStyle = "Black";
        draw.textAlign = "center";
        draw.font = "50px Helvetica";
        draw.fillText("You did it!", canvas.width/2, canvas.height/2);

    }

    var keyboard_callback = function(info) {
        if (!keyable) {
            return;
        }
        var mutagen_loc;
        if (info.key === 65) {
            //liquid
            mutagen_loc = 0;

        } else if (info.key === 71) {
            //ray
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
        action_history.push(this_action); 

        // animate
        keyable = false;
        animate_mutation(mutagen_loc, function() {
            current_location = next_fractal(current_location, this_action);
            draw_current_setup(current_location);
            location_history.push(current_location);
            this_location_time = (new Date()).getTime();

            if (current_location == trial.goal) {
                setTimeout(function() {
                    display_congratulations();
                    setTimeout(end_function, 2000); 
                }, 500);
            } else {
                keyable = true;
            }
        })

        return;
    };


    ////// End fractal stuff /////////////////////////////////////////////////////////
    
    function end_function() {

      jsPsych.pluginAPI.cancelAllKeyboardResponses();
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

    var keyboard_listener;
    // start trial once images are loaded
    jsPsych.pluginAPI.preloadImages(trial.fractal_assignment, function() {
        draw_current_setup(current_location);
        keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: keyboard_callback,
            valid_responses: [65, 71],
            rt_method: 'date',
            persist: true 
        });
        keyable = true; 
    });
  };

  return plugin;
})();
