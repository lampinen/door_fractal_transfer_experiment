import numpy as np

class dihedral_group(object):
    def __init__(self, nsides=6):
        self.order = 2 * nsides
        self.nsides = nsides

    def get_some_generators(self):
        return [1, self.nsides]

    def parse(self, x):
        rx = x % self.nsides
        sx = x // self.nsides
        return rx, sx

    def operation(self, x, y):
        rx, sx = self.parse(x)
        ry, sy = self.parse(y)

        if (sx == 0):
            rres = (rx + ry) % self.nsides
            sres = sy;
        else:
            rres = (rx + self.nsides - ry) % self.nsides
            sres = (sx + sy) % 2;

        return rres + self.nsides * sres


class dicyclic_group_12(object):
    def __init__(self):
        self.order = 12 

    def get_some_generators(self):
        return [1, 4]

    def parse(self, x):
        rx = x % 4
        sx = x // 4
        return rx, sx

    def operation(self, x, y):
        rx, sx = self.parse(x)
        ry, sy = self.parse(y)

        if (sx == 0):
            rres = (rx + ry) % 4
            sres = sy
        elif (ry % 2 == 0): # commutes 
            rres = (rx + ry) % 4
            sres = (sx + sy) % 3
        else:
            rres = (rx + ry) % 4
            sres = (sy + 3 - sx) % 3
        return rres + 4 * sres


# Non group structures

class square_cycles(object):
    def __init__(self):
        self.order = 8 

    def get_some_generators(self):
        return [0, 1]

    def operation(self, x, y):
        if (y not in [0, 1]):
            raise ValueError("Square cycle operation error!")

	if (x < 4): # lower cycle
	    if (y == 0):
		res = (x + 1) % 4;
	    else:
		if ((x % 2) == 1):
		    res = x - 1;
		else:
		    res = x + 4;
	    
	else: #upper cycle
	    if (y == 0):
		res = 4 + ((x - 1) % 4);
	    else:
		if ((x % 2) == 0):
		    res = x + 1;
		else:
		    res = x - 4;
		
	return res 
	

class tr_cycles(object):
    def __init__(self):
        self.order = 8 

    def get_some_generators(self):
        return [0, 1]

    def operation(self, x, y):
        if (y not in [0, 1]):
            raise ValueError("Square cycle operation error!")

        if (y == 1):
            if (x == 0):
                res = 3;
            else if (x == 3):
                res = 4;
            else if (x == 6):
                res = 5;
            else if (x == 5):
                res = 2;
            else:
                res = (x + 4) % 8;
            
        else: # y == 0
            if (x == 0):
                res = 2;
            else if (x == 6):
                res = 4;
            else if (x == 1 || x == 2):
                res = x - 1;
            else if (x == 4):
                res = 7;
            else if (x == 7):
                res = 6;
            else:
                res = (x + 4) % 8;
		
	return res 

