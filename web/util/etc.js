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

//data/server communication
function saveData(filename, filedata){
   $.ajax({
      type: 'post',
      cache: false,
      url: 'http://web.stanford.edu/~lampinen/cgi-bin/save_data.php', 
      data: {filename: filename, filedata: filedata}
   });
}

function load_data(filename, callback, error_callback){
   $.ajax({
      type: "post",
      url: 'http://web.stanford.edu/~lampinen/cgi-bin/recover_auxiliary_data.php', 
      cache: false,
      data: {filename: filename},
      dataType: 'json',
      success: callback,
      error: error_callback});
}

