//Entry point for entire application

//import constructor
import {builder} from './builder';

//import prototypes
import {
    drawings, 
    imagetoggler, 
    videotoggler,
    cfgexpand,
    newtab,
    tabclick,
    tabXclick,
    scrollBottom,
    getTheme,
    randomizedstartinganimation,
    render,
    submitmsg,
    redheader,
}  from './builder';

//import net events
import {events} from './net'

//apply prototypes to constructor
builder.prototype.drawings                      = drawings;
builder.prototype.imagetoggler                  = imagetoggler;
builder.prototype.videotoggler                  = videotoggler;
builder.prototype.cfgexpand                     = cfgexpand;
builder.prototype.newtab                        = newtab;
builder.prototype.tabclick                      = tabclick;
builder.prototype.tabXclick                     = tabXclick;
builder.prototype.scrollBottom                  = scrollBottom;
builder.prototype.getTheme                      = getTheme;
builder.prototype.randomizedstartinganimation   = randomizedstartinganimation;
builder.prototype.render                        = render;
builder.prototype.submitmsg                     = submitmsg;
builder.prototype.redheader                     = redheader;

//instantiate builder and send it a socket to use for communication
let socket = io();
let chat = new builder(socket);

//apply net events
events(socket, chat);