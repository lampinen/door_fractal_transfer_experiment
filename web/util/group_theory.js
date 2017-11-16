/**
An implementation of a few simple groups in a javascript framework
**/

// Python-like range runction
function range(n) { 
    var result = [];
    for (i = 0; i < n; i++) { 
        result.push(i);
    }
    return result;
}

// Groups /////////////////////////////////////////////////////////////////////
function cyclic_group(order) {
    this.order = order;
    this.elements = range(order);
}

cyclic_group.prototype.get_order = function() {
    return this.order;
}

cyclic_group.prototype.get_elements = function() {
    return this.elements;
}


cyclic_group.prototype.operation = function(x, y) {
    return (x + y) % this.order;
}



// Dicyclic, where each element x is represented in a canonical form such that
// int(x / 4) s-applications followed by (x % 4) r-applications, s & r being
// group generators
function dicyclic_group_12 () {
    this.order = 12;
    this.elements = range(12);
}

dicyclic_group_12.prototype.get_order = function() {
    return this.order;
}

dicyclic_group_12.prototype.get_elements = function() {
    return this.elements;
}

// gets *SOME* generating set (actually the canonical one)
dicyclic_group_12.prototype.get_some_generators = function() {
    return [0, 4];
}

dicyclic_group_12.prototype.operation = function(x, y) {
    var rx = x % 4;
    var sx = Math.floor(x / 4);
    var ry = y % 4;
    var sy = Math.floor(y / 4);

    var rres = 0;
    var sres = 0;
    if (sx == 0) {
        rres = (rx + ry) % 4;
        sres = sy;
    } else if (ry % 2 == 0) { // commutes
        rres = (rx + ry) % 4;
        sres = (sx + sy) % 3;
    } else {
        rres = (rx + ry) % 4;
        sres = (sy + 3 - sx) % 3;
    }
    return rres + 4 * sres;
}


// Dihedral, where each element x is represented in a canonical form such that
// int(x / n) s-applications followed by (x % n) r-applications, s & r being
// group generators (flip and rotation, respectively)
function dihedral_group (num_sides) {
    this.num_sides = num_sides;
    this.order = num_sides*2;
    this.elements = range(num_sides*2);
}

dihedral_group.prototype.get_order = function() {
    return this.order;
}

dihedral_group.prototype.get_elements = function() {
    return this.elements;
}

// gets *SOME* generating set (actually the canonical one)
dihedral_group.prototype.get_some_generators = function() {
    return [0, this.num_sides];
}

dihedral_group.prototype.operation = function(x, y) {
    var rx = x % this.num_sides;
    var sx = Math.floor(x / this.num_sides);
    var ry = y % this.num_sides;
    var sy = Math.floor(y / this.num_sides);

    var rres = 0;
    var sres = 0;
    if (sx == 0) {
        rres = (rx + ry) % this.num_sides;
        sres = sy;
    } else {
        rres = (rx + this.num_sides - ry) % this.num_sides;
        sres = (sx + sy) % 2;
    }
    return rres + this.num_sides * sres;
}
