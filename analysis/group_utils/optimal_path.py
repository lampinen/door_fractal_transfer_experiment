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

    if rg % 2 == 0:
        ls = ss
        lg = (-sg) % 3
    else:
        ls = (-ss) % 3
        lg = sg
    lev_dist = (lg - ls) % 3

    if (rs + rg) % 2 == 0: # commutes
        if ss == sg: # same cycle
            return 0
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
        return -1
    else: 
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

def BFS(state, goal, group, generators=None):
    """Breadth first search for shortest path to goal, only terminates at full
       tree of given depth (in case multiple possible actions w/ same path
       length). Not memory efficient, but these groups are small."""
    if generators is None:
        generators = group.get_some_generators()

    generator_translation_dict = {gen: i for (i, gen) in enumerate(generators)} # return generator indices instead of generators themselves 

    queue_next_depth = [(state, [], action) for action in generators] # (state, action_path, next_action) pairs
    solution_paths = [] 

    while solution_paths == []:
        queue = queue_next_depth
        queue_next_depth = []

        for (state, path, next_action) in queue:
            new_state = group.operation(state,next_action)
            new_path = path + [generator_translation_dict[next_action]]
            if new_state == goal:
                solution_paths.append(new_path)
            else:
                queue_next_depth.extend([(new_state, new_path, action) for action in generators])

    return solution_paths


def BFS_unique_optimal_action(state, goal, group):
    """Returns *unique* optimal action if it exists, or -1 if not unique""" 

    solution_paths = BFS(state, goal, group)
    if len(solution_paths) > 1:
       return -1
    return solution_paths[0][0] # first action of optimal path
    

if __name__ == "__main__":
#    d6_table = np.full([12, 12], fill_value=-1)
#    d6_table2 = np.full([12, 12], fill_value=-1)
#
#    dc12_table = np.full([12, 12], fill_value=-1)
#
#    for state in xrange(12):
#        for goal in xrange(12):
#            d6_table[state, goal] = BFS_unique_optimal_action(state, goal, d6) 
#            dc12_table[state, goal] = BFS_unique_optimal_action(state, goal, dc12) 
#
#    np.savetxt("d6_table.csv", d6_table, fmt='%i', delimiter=',')
#    np.savetxt("dc12_table.csv", dc12_table, fmt='%i', delimiter=',')

    sq = square_cycles() 
    tr = tri_cycles() 
    sq_table = np.full([8, 8], fill_value=-1)

    tr_table = np.full([8, 8], fill_value=-1)

    for state in xrange(8):
        for goal in xrange(8):
            sq_table[state, goal] = BFS_unique_optimal_action(state, goal, sq) 
            tr_table[state, goal] = BFS_unique_optimal_action(state, goal, tr) 

    np.savetxt("sq_table.csv", sq_table, fmt='%i', delimiter=',')
    np.savetxt("tr_table.csv", tr_table, fmt='%i', delimiter=',')
