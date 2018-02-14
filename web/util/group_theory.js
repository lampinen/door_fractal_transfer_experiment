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

cyclic_group.prototype.get_name = function() {
    return "cyclic group of order " + this.order;
}

cyclic_group.prototype.operation = function(x, y) {
    return (x + y) % this.order;
}



// Dicyclic, where each element x is represented in a canonical form such that
// (x % 4) r-applications followed by int(x / 4) s-applications, s & r being
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

dicyclic_group_12.prototype.get_name = function() {
    return "dicyclic group of order " + this.order;
}

// gets *SOME* generating set (actually the canonical one)
dicyclic_group_12.prototype.get_some_generators = function() {
    return [1, 4];
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
// (x % n) r-applications followed by int(x / n) s-applications, s & r being
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

dihedral_group.prototype.get_name = function() {
    return "dihedral group of order " + this.order;
}

// gets *SOME* generating set (actually the canonical one)
dihedral_group.prototype.get_some_generators = function() {
    return [1, this.num_sides];
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


///////////////////// Non groups, but using the same general framing for simplicity of coding

// square_attractors
function square_attractors() {
    this.order = 8;
    this.elements = range(8);
}

square_attractors.prototype.get_order = function() {
    return this.order;
}

square_attractors.prototype.get_elements = function() {
    return this.elements;
}

square_attractors.prototype.get_name = function() {
    return "square attractors (cube, non-group)"
}

// gets *SOME* generating set (actually the canonical one)
square_attractors.prototype.get_some_generators = function() {
    return [0, 1];
}

square_attractors.prototype.operation = function(x, y) {
    // only defined if y is an action 
    if (y != 0 && y != 1) {
        alert("Square attractor operation error!");
        return y;
    }

    if (x < 4) { // lower cycle
        if (y == 0) {
            res = (x + 1) % 4;
        } else {
            res = x + 4;
        }
    } else { //upper cycle
        if (y == 1) {
            res = 4 + ((x - 1) % 4);
        } else {
            res = x - 4;
        }
    }
    
    return res
}
