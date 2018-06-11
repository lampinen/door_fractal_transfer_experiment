from itertools import permutations


sq_targets = [[1, 2, 3, 4, 5, 6, 7, 8], [2, 1, 5, 6, 3, 4, 8, 7], [3, 4, 1, 2, 7, 8, 5, 6], [4, 3, 7, 8, 1, 2, 6, 5], [5, 6, 2, 1, 8, 7, 3, 4], [6, 5, 8, 7, 2, 1, 4, 3], [7, 8, 4, 3, 6, 5, 1, 2], [8, 7, 6, 5, 4, 3, 2, 1]]
od_targets = [[1, 2, 3, 4, 5, 6, 7, 8], [7, 8, 5, 6, 3, 4, 1, 2]]


chance_correct_sq = 0
chance_correct_od = 0

for perm in permutations([1,2,3,4,5,6,7,8]):
    chance_correct_sq += max([sum([perm[j] == sq_targets[i][j] for j in range(8)]) for i in range(len(sq_targets))])
    chance_correct_od += max([sum([perm[j] == od_targets[i][j] for j in range(8)]) for i in range(len(od_targets))])

num_perms = 8*7*6*5*4*3*2.
chance_correct_sq /= num_perms
chance_correct_od /= num_perms
print(chance_correct_sq)
print(chance_correct_od)


chance_correct_alignment_sq = 0.
for perm_i in range(len(sq_targets)):
    for perm_j in range(len(sq_targets)):
        chance_correct_alignment_sq += sum([sq_targets[perm_i][k] == sq_targets[perm_j][k] for k in range(8)])
chance_correct_alignment_sq /= len(sq_targets) **2

print(chance_correct_alignment_sq)


chance_correct_alignment_od = 0.
for perm_i in range(len(od_targets)):
    for perm_j in range(len(od_targets)):
        chance_correct_alignment_od += sum([od_targets[perm_i][k] == od_targets[perm_j][k] for k in range(8)])
chance_correct_alignment_od /= len(od_targets) **2

print(chance_correct_alignment_od)
