if (typeof(jQuery) == 'undefined') alert('jQuery library was not found.');

(function ($) {
    
    $.fn.extend({
        imagePlayer: function(options) {
            if (options && typeof(options) == 'object') {
                options = $.extend({}, $.imagePlayer.settings, options);
            }
            return this.each(function() {
                try {
                    new $.imagePlayer(this, options);
                } catch (e) {
                    console.error(e);
                }
            });
        } 
    });
    
    $.imagePlayer = function (self, options) {
        var playlist = $(self);
        var player_id = self.id;
        var images = [];
        var player, stage, controls, start, play_pause, end, scrubber, scrubber_handle, frame_count, image = null;
        var last_frame_scrubber_pos = 0;
        var inc; // delta inc for scrubber
        var i = 0; // current image
        var rotator = null;
        var settings = options;
        playlist.find('img').each(function() {
            images.push(this.src);
        });
        
        if(images.length == 0) {
            throw "No images found!";
        }
        
        create_player();
        if(settings.autoStart === true) {
            image_cycle();
        } else {
            set_image(images[0]);
        }

        function create_player() {
            // Player elements.
            player          = $('<div>').addClass('img_player');
            stage           = $('<div>').addClass('stage');
            controls        = $('<div>').addClass('controls');
            start           = $('<a>').attr('href', '#').addClass('start');
            play_pause      = $('<a>').attr('href', '#');
            end             = $('<a>').attr('href', '#').addClass('end');
            scrubber        = $('<div>').addClass('scrubber');
            scrubber_handle = $('<a>').attr('href', '#');
            frame_count     = $('<span>').addClass('frame_count');
            // Set dimensions
            player.css({
                width:settings.stageWidth + 'px',
                height:settings.stageHeight + 50 + 'px'
            });
            stage.css({
                width:settings.stageWidth + 'px',
                height:settings.stageHeight + 'px'
            });
            controls.css({
                width:settings.stageWidth + 'px'
            });
            scrubber.css({
                width:settings.stageWidth - 180 + 'px'
            });
            // Set the right control for play/pause.
            (settings.autoStart===true) ? play_pause.addClass('pause') : play_pause.addClass('play');
            // Bind mouse interactions
            stage.bind('mouseenter', function(e) {
                handle_image_hover(e, this);
            }).bind('mouseleave', function(e) {
                handle_image_out(e, this);
            }); // .hover seems not tow work?
            play_pause.bind('click', function(e) {
                handle_control_click(e, this);
            });
            start.bind('click', function(e) {
                handle_start_click(e, this);
            });
            end.bind('click', function(e) {
                handle_end_click(e, this);
            });
            scrubber.bind('click', function(e) {
                handle_scrubber_click(e, this);
            });
            // Build the player.
            player.append(stage).append(controls.append(start).append(play_pause).append(end).append(scrubber.append(scrubber_handle)).append(frame_count));         
            playlist.hide().after(player);
            inc = Math.floor(scrubber.width() / images.length);
        }
        
        function set_image(img) {
            var image_object = {
                src: img, 
                alt: 'Slide ' + i + 1, 
                width: settings.stageWidth, 
                height: settings.stageHeight
            };
            if (image === null) {
                image = $('<img>').attr(image_object);
                stage.html(image);
            } else {
                image.attr(image_object);      
            }
            frame_count.html(i+1 + '/' + images.length);
        }
        
        function image_cycle() {
            clearTimeout(rotator);
            if(settings.loop === true) {
                if (i > images.length - 1) {
                    i = 0;
                    // stop animation
                    scrubber_handle.stop(true, true);
                    scrubber_handle.css('left', '0');
                }
            }
            if (i < images.length) {
                image_transition(images[i]);
            }
            i++;
        }
        
        function image_transition(img) {
            set_image(img);
            // animate scrubber
            last_frame_scrubber_pos = parseFloat(scrubber_handle.css('left'));
            var remaining = inc*(i+1) - last_frame_scrubber_pos;
            var percent = Math.floor(remaining / inc);
            scrubber_handle.stop(true, true);
            scrubber_handle.animate({
                left: '+='+remaining+'px'
            }, settings.delay*1000, 'linear');
            rotator = setTimeout(image_cycle, settings.delay * 1000);
        }
        
        function handle_image_hover(e, elem) {
            if(settings.pauseOnHover === true && play_pause.attr('class') === 'pause') { // is playing
                clearTimeout(rotator);
                scrubber_handle.stop(true, true);  
            }
        }
        
        function handle_image_out(e, elem) {
            if(settings.pauseOnHover === true && play_pause.attr('class') === 'pause') {   
                image_cycle();
            }
        }
        
        function handle_control_click(e, elem) {
            e.preventDefault();
            elem = $(elem, player);
            // try if we can use "hasClass"
            if(elem.attr('class') == 'pause') { // it's playing (then pause)
                elem.attr('class', 'play');
                clearTimeout(rotator);
                scrubber_handle.stop(true, false);
                scrubber_handle.css('left', last_frame_scrubber_pos + 'px');
                i--;
            } else { // paused (we have to resume playback)
                image_cycle();
                elem.attr('class', 'pause');
            }
        }
        
        function handle_start_click(e, elem) {
            e.preventDefault();
            elem = $(elem, player);
            clearTimeout(rotator);
            scrubber_handle.stop(true, false);
            i = 0;
            scrubber_handle.css('left', '0px');
            if(play_pause.attr('class') === 'pause') { // was playing
                image_cycle();
            } else {
                set_image(images[i]);
            }
        }
        
        function handle_end_click(e, elem) {
            e.preventDefault();
            elem = $(elem, player);
            clearTimeout(rotator);
            scrubber_handle.stop(true, false);
            i = images.length - 1;
            scrubber_handle.css('left', (i+1)*inc + 'px');
            if(play_pause.attr('class') === 'pause') { // was playing
                image_cycle();
            } else {
                set_image(images[i]);
            }
        }
        
        function handle_scrubber_click(e, elem) {
            var pos, x_coord, delta_p, delta_n;
            e.preventDefault();
            elem = $(elem, player);
            clearTimeout(rotator);
            scrubber_handle.stop(true, false);
            pos = elem.offset();
            x_coord = Math.ceil(e.pageX - pos.left);
            i = Math.floor(x_coord / inc);
            delta_p = Math.abs(inc*i - x_coord);
            delta_n = Math.abs(inc*(i+1) - x_coord);
            if(delta_p <= delta_n) {
                scrubber_handle.css('left', (x_coord - delta_p) + 'px');
            } else {
                scrubber_handle.css('left', (x_coord + delta_n) + 'px');
                if(i < images.length - 1) i++;
            }
            if(play_pause.attr('class') === 'pause') { // was playing
                image_cycle();
            } else {
                set_image(images[i]);
            }
            
        }
        
    };
    
    $.imagePlayer.settings = {
        stageWidth:400,
        stageHeight:300,
        autoStart:false,
        pauseOnHover:true,
        delay:1,
        loop:true
    };
    
})(jQuery);