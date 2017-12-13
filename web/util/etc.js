/**
Various useful functions
**/

// Stolen from the internet, shuffles array in place
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

// chooses a random element from an array 
function choice(a) {
    return a[Math.floor(Math.random() * a.length)];
}

