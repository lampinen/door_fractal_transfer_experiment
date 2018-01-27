import numpy as np
from group_theory import *

d6 = dihedral_group(6)
dc12 = dicyclic_group_12()

def dihedral_6_optimal_action(state, goal):
    rs, ss = d6.parse(state)
    rg, sg = d6.parse(goal)

    if ss == sg: # same ring
        if ss == 0:
            dist = (rg - rs) % 6
            if dist < 4:
                return 0
            elif dist == 4:
                return -1
            else:
                return 1
        else: 
            dist = (rs - rg) % 6
            if dist < 4:
                return 0
            elif dist == 4:
                return -1
            else:
                return 1
    else: # different rings
        if ss == 0:
            dist = (rg - rs) % 6
            if 0 < dist < 3:
                return 0
            elif dist == 3: 
                return -1
            else:
                return 1
        else: 
            dist = (rs - rg) % 6
            if 0 < dist < 3:
                return 0
            elif dist == 3:
                return -1
            else:
                return 1



def dicyclic_12_optimal_action(state, goal):
    rs, ss = dc12.parse(state)
    rg, sg = dc12.parse(goal)


    if rs == rg: # same 3-cycle
        return 1
    elif (rs + rg) % 2 == 0: # commutes
        if ss == sg: # same cycle
            return 0
        return -1
    else: 
        if rg % 2 == 0:
            ls = ss
            lg = (-sg) % 3
        else:
            ls = (-ss) % 3
            lg = sg
        lev_dist = (lg - ls) % 3

        if lev_dist == 0:
            return 0

        dist = (rg - rs) % 4
        if dist == 1: 
            if lev_dist == 1:
                if rg % 2 == 0:
                    return 1
                else:
                    return 0
            else: # lev_dist == 2
                if rg % 2 == 0:
                    return 0
                else:
                    return 1
        else: # dist == 3
            if lev_dist == 1:
                if rg % 2 == 0:
                    return -1
                else:
                    return 0
            else: # lev_dist == 2
                if rg % 2 == 0:
                    return 0
                else:
                    return -1
if __name__ == "__main__":
    d6_table = np.full([12, 12], fill_value=-1)
    dc12_table = np.full([12, 12], fill_value=-1)

    for state in xrange(12):
        for goal in xrange(12):
            d6_table[state, goal] = dihedral_6_optimal_action(state, goal)
            dc12_table[state, goal] = dicyclic_12_optimal_action(state, goal)

    np.savetxt("d6_table.csv", d6_table, fmt='%i', delimiter=',')
    np.savetxt("dc12_table.csv", dc12_table, fmt='%i', delimiter=',')
