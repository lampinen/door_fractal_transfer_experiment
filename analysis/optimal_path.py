import numpy as np
from group_theory import *

d6 = dihedral_group(6)
dc12 = dicyclic_group_12()

def dihedral_6_optimal_action(start, goal):
    rs, ss = d6.parse(start)
    rg, sg = d6.parse(goal)

    if ss == sg: # same ring
        if ss == 0:
            dist = (rg - rs) % 6
            if dist < 4:
                return 0
            elif dist == 4:
                return None
            else:
                return 1
        else: 
            dist = (rs - rg) % 6
            if dist < 4:
                return 0
            elif dist == 4:
                return None
            else:
                return 1
    else: # different rings
        if ss == 0:
            dist = (rg - rs) % 6
            if 0 < dist < 3:
                return 0
            elif dist == 3: 
                return None
            else:
                return 1
        else: 
            dist = (rs - rg) % 6
            if 0 < dist < 3:
                return 0
            elif dist == 3:
                return None
            else:
                return 1
