export default function(e){
    let el = this.cgroup.children().toArray()
    if (e.target.parentElement.innerText.slice(0, -1) == this.curtab){
        if ($(e.target.parentElement).is(':last-child')){
            el[el.length-2].click();
        } else {
            let index = el.indexOf(e.target.parentElement);
            el[index + 1].click();
        }
    }
    e.target.parentElement.remove();
    for (let msgsgrp in this.msgs){
        if(msgsgrp == e.target.id.substr(4)){
            this.msgs[msgsgrp].remove();
            delete this.msgs[msgsgrp];
        }
    }
}