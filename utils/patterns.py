"""Generating patterns of location visits for the experiment"""
from numpy.random import shuffle
num_locations = 8
num_trials = 50

num_perms = (num_trials // num_locations) + 1


blah = [range(num_locations) for i in xrange(num_perms)]
[shuffle(x) for x in blah] # in place
blah = [x for y in blah for x in y]
blah = blah[:num_trials+1]
while any([blah[i] == blah[i+1] for i in xrange(num_trials)]):
    blah = [range(num_locations) for i in xrange(num_perms)]
    [shuffle(x) for x in blah] # in place
    blah = [x for y in blah for x in y]
    blah = blah[:num_trials+1]

blah2 = ", ".join(["{start: %i, goal: %i, progress: %i}" %(blah[i], blah[i+1], int(100*(float(i)/num_trials))) for i in xrange(num_trials)])
print(blah2)


