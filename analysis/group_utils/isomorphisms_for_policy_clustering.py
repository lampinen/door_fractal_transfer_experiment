from itertools import permutations


hb_targets = [[1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 1], [3, 4, 5, 6, 1, 2], [4, 5, 6, 1, 2, 3],
              [5, 6, 1, 2, 3, 4], [6, 1, 2, 3, 4, 5], [2, 1, 6, 5, 4, 3], [3, 2, 1, 6, 5, 4],
              [4, 3, 2, 1, 6, 5], [5, 4, 3, 2, 1, 6], [6, 5, 4, 3, 2, 1], [1, 6, 5, 4, 3, 2]]
ht_targets = [[1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1], [4, 5, 6, 1, 2, 3], [3, 2, 1, 6, 5, 4]]


original_order = [(i, j) for i in range(6) for j in range(6)]

hb_orders = []
for hb_perm in hb_targets:
    this_order = range(36)
    for k, (i, j) in enumerate(original_order):
        this_order[k] = original_order.index((hb_perm[i]-1, hb_perm[j]-1))
    this_order = [-2, -1] + this_order # other columns
    this_order = "c" + str(tuple([x + 3 for x in this_order])) # For permuting 1-indexed columns shifted over by 2
    hb_orders.append(this_order)

print 'list(' + ', '.join(hb_orders) + ')' 

ht_orders = []
for ht_perm in ht_targets:
    this_order = range(36)
    for k, (i, j) in enumerate(original_order):
        this_order[k] = original_order.index((ht_perm[i]-1, ht_perm[j]-1))
    this_order = [-2, -1] + this_order # other columns
    this_order = "c" + str(tuple([x + 3 for x in this_order])) # For permuting 1-indexed columns shifted over by 2
    ht_orders.append(this_order)

print 'list(' + ', '.join(ht_orders) + ')' 
