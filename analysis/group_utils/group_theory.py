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
	

class tri_cycles(object):
    def __init__(self):
        self.order = 8 

    def get_some_generators(self):
        return [0, 1]

    def operation(self, x, y):
        if (y not in [0, 1]):
            raise ValueError("Tri cycle operation error!")

        if (y == 1):
            if (x == 0):
                res = 3;
            elif (x == 3):
                res = 4;
            elif (x == 6):
                res = 5;
            elif (x == 5):
                res = 2;
            else:
                res = (x + 4) % 8;
            
        else: # y == 0
            if (x == 0):
                res = 2;
            elif (x == 6):
                res = 4;
            elif (x in [1, 2]):
                res = x - 1;
            elif (x == 4):
                res = 7;
            elif (x == 7):
                res = 6;
            else:
                res = (x + 4) % 8;
		
	return res 



class hexagon_bi(object):
    def __init__(self):
        self.order = 6 

    def get_some_generators(self):
        return [0, 1]

    def operation(self, x, y):
	if (y != 0 and y != 1):
	    print("Hexagon bi operation error!");
	    return y;

	if (y == 1):
	    if (x == 0):
		res = 1;
	    elif (x == 1):
		res = 0;
	    elif (x == 2):
		res = 3;
	    elif (x == 3):
		res = 2;
	    elif (x == 4):
		res = 5;
	    elif (x == 5):
		res = 4;
	    else:
		print("Hexagon bi operation error!");
		return x;
	else:
	    if (x == 0):
		res = 5;
	    elif (x == 1):
		res = 2;
	    elif (x == 2):
		res = 1;
	    elif (x == 3):
		res = 4;
	    elif (x == 4):
		res = 3;
	    elif (x == 5):
		res = 0;
	    else:
		print("Hexagon bi operation error!");
		return x;

	return res
	

class hexagon_tri(object):
    def __init__(self):
        self.order = 6 

    def get_some_generators(self):
        return [0, 1]

    def operation(self, x, y):
	if (y != 0 and y != 1):
	    print("Hexagon tri operation error! %i %i" % (x, y))
	    return y;

	if (y == 1):
	    if (x == 0):
		res = 1;
	    elif (x == 1):
		res = 5;
	    elif (x == 5):
		res = 0;
	    elif (x == 2):
		res = 3;
	    elif (x == 3):
		res = 4;
	    elif (x == 4):
		res = 2;
	    else:
                print("Hexagon tri operation error! %i %i" % (x, y))
		return x;
	else:
	    if (x == 0):
		res = 5;
	    elif (x == 4):
		res = 0;
	    elif (x == 5):
		res = 4;
	    elif (x == 1):
		res = 3;
	    elif (x == 2):
		res = 1;
	    elif (x == 3):
		res = 2;
	    else:
                print("Hexagon tri operation error! %i %i" % (x, y))
		return x;
        return res

class odd_cycles(object):
    def __init__(self):
        self.order = 8;
        self.elements = range(8);

    def get_some_generators(self): 
        return [0, 1]

    def operation(self, x, y):
        # only defined if y is an action 
        if (y != 0 and y != 1):
            print("Odd cycles operation error!")
            return y

        if (y == 1):
            if (x == 0):
                res = 3
            elif (x == 3):
                res = 1
            elif (x == 1):
                res = 0
            elif (x == 2):
                res = 6
            elif (x == 5):
                res = 2
            elif (x == 7):
                res = 4
            else: #6, 4
                res = x + 1
        else: # y == 0
            if (x == 4):
                res = 0
            elif (x == 5):
                res = 7 
            elif (x == 6):
                res = 5 
            elif (x == 7):
                res = 6
            else: # 0-3
                res = x + 1
        
        return res

