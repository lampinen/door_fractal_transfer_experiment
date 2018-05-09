from itertools import permutations


hb_targets = [[1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 1], [3, 4, 5, 6, 1, 2], [4, 5, 6, 1, 2, 3],
              [5, 6, 1, 2, 3, 4], [6, 1, 2, 3, 4, 5], [2, 1, 6, 5, 4, 3], [3, 2, 1, 6, 5, 4],
              [4, 3, 2, 1, 6, 5], [5, 4, 3, 2, 1, 6], [6, 5, 4, 3, 2, 1], [1, 6, 5, 4, 3, 2]]
ht_targets = [[1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1], [4, 5, 6, 1, 2, 3], [3, 2, 1, 6, 5, 4]]


chance_correct_hb = 0
chance_correct_ht = 0

for perm in permutations([1,2,3,4,5,6]):
    chance_correct_hb += max([sum([perm[j] == hb_targets[i][j] for j in range(6)]) for i in range(len(hb_targets))])
    chance_correct_ht += max([sum([perm[j] == ht_targets[i][j] for j in range(6)]) for i in range(len(ht_targets))])

num_perms = 6*5*4*3*2.
chance_correct_hb /= num_perms
chance_correct_ht /= num_perms
print(chance_correct_hb)
print(chance_correct_ht)


chance_correct_alignment_hb = 0.
for perm_i in range(len(hb_targets)):
    for perm_j in range(len(hb_targets)):
        chance_correct_alignment_hb += sum([hb_targets[perm_i][k] == hb_targets[perm_j][k] for k in range(6)])
chance_correct_alignment_hb /= len(hb_targets) **2

print(chance_correct_alignment_hb)


chance_correct_alignment_ht = 0.
for perm_i in range(len(ht_targets)):
    for perm_j in range(len(ht_targets)):
        chance_correct_alignment_ht += sum([ht_targets[perm_i][k] == ht_targets[perm_j][k] for k in range(6)])
chance_correct_alignment_ht /= len(ht_targets) **2

print(chance_correct_alignment_ht)
