export default function(){
	setInterval(()=> {
	    $('.redshadow').animate({
	        opacity: 1.0
	    }, 500).animate({
	        opacity: .2
	    });
	}, 1000);
}