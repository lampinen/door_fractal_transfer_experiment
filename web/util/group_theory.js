/**
An implementation of a few simple groups in a javascript framework
**/

// Python-like range runction
function range(n) { 
    var result = [];
    for (i = 0; i < n; i++) { 
        result.push(i);
    }
}

// Groups /////////////////////////////////////////////////////////////////////
function cyclic_group(order) {
    this.order = order;
    this.elements = range(order);
}

cyclic_group.prototype.get_order() = function() {
    return this.order;
}

cyclic_group.prototype.operation = function(x, y) {
    return (x + y) % this.order;
}


