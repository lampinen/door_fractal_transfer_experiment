import numpy as np

class dihedral_group(object):
    def __init__(self, nsides=6):
        self.order = 2 * nsides
        self.nsides = nsides

    def get_some_generators(self):
        return [1, self.nsides]

    def operation(self, x, y):
        rx = x % self.nsides
        sx = x // self.nsides
        ry = y % self.nsides
        sy = y // self.nsides

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

    def operation(self, x, y):
        rx = x % 4
        sx = x // 4
        ry = y % 4
        sy = y // 4

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


