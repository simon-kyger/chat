export default function(args) {
    let bgformatted;
    let shadow;
    let text;
    let cinput;
    if (args > 0)
        text = 'black';
    else
        text = 'white';

    let randomrgb = [((Math.floor(Math.random()*150)+55)+args), ((Math.floor(Math.random()*150)+55)+args), ((Math.floor(Math.random()*150)+55)+args)];
    let darker = [];
    let darkest = [];
    for(let i=0; i<randomrgb.length; i++){
        randomrgb[i] < 0 ? randomrgb[i] = 0 : randomrgb[i];
        randomrgb[i] > 255 ? randomrgb[i] = 255 : randomrgb[i];
        randomrgb[i]-30 < 0 ? darker.push(0) : darker.push(randomrgb[i]-30);
        randomrgb[i]-50 < 0 ? darkest.push(0) : darkest.push(randomrgb[i]-50);
    }
    bgformatted = `rgb(${randomrgb[0]},${randomrgb[1]},${randomrgb[2]})`;
    shadow = `0 0 10px 10000px rgb(${darker[0]},${darker[1]},${darker[2]})`;
    cinput = `rgb(${darkest[0]},${darkest[1]},${darkest[2]})`;
    let ret = {
        bgformatted: bgformatted,
        shadow: shadow,
        cinput: cinput,
        text: text
    }
    return ret;
}