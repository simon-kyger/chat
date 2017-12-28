export default function() {
    this.msgs[this.curtab].stop().animate({
        scrollTop: this.msgs[this.curtab][0].scrollHeight
    }, 1000); // SET SCROLLER TO BOTTOM DOESNT WORK WITH DOUBLE YOUTUBE SEND :(
}