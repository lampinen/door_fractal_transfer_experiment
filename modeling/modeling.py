from __future__ import print_function
from __future__ import absolute_import
from __future__ import division

import numpy as np
import tensorflow as tf
import tensorflow.contrib.slim as slim
import os

from group_theory import *

### Parameters
num_nodes_per = 6
num_output_per = 2
num_hidden = 32
num_layers = 4
num_runs = 10 
run_offset = 0
learning_rate = 0.003
num_trials = 2500
epsilon = 0.1 # noise in epsilon greedy
gamma = 0.8 # discount factor
max_steps_per_trial = 20
replay_steps_per_trial = 20
init_mult = 0.5
output_dir = "results/" 
input_shared = True
save_every = 5 
batch_size = 1
graphs = [hexagon_bi(), hexagon_tri()]
###
if not os.path.exists(os.path.dirname(output_dir)):
    os.makedirs(os.path.dirname(output_dir))

var_scale_init = tf.contrib.layers.variance_scaling_initializer(factor=init_mult, mode='FAN_AVG')
nonlinearity = tf.nn.leaky_relu

def encode_one_hot(loc_i, goal_j, task, size=num_nodes_per):
    res = np.zeros([1, 4*size])
    res[0, loc_i +  (task-1)*2*size] = 1.
    res[0, goal_j + ((task-1)*2 + 1)*size] = 1.
    return res


class transfer_model(object):
    def __init__(self, num_nodes_per, num_actions_per, graphs):
        self.num_nodes_per = num_nodes_per
        self.num_actions_per = num_actions_per
        self.graphs = graphs
        self.memory_buffer = []
        num_input_per = 2*num_nodes_per
        
        self.input_ph = tf.placeholder(tf.float32, shape=[None, 2*num_input_per])
        self.target_ph = tf.placeholder(tf.float32, shape=[None, 2*num_output_per])
        self.mask_ph = tf.placeholder(tf.bool, shape=[None, 2*num_output_per])

        current_hidden = self.input_ph
        for layer_i in range(num_layers - 1):
            current_hidden = slim.fully_connected(current_hidden,
                                                  num_hidden,
                                                  activation_fn=nonlinearity)
        self.output = slim.fully_connected(current_hidden,
                                           2*num_output_per,
                                           activation_fn=None)
        self.greedy_choice = tf.argmax(tf.boolean_mask(self.output, self.mask_ph), axis=-1)
        
        self.loss = tf.nn.l2_loss(tf.boolean_mask(self.target_ph, self.mask_ph) - tf.boolean_mask(self.output, self.mask_ph))

        optimizer = tf.train.GradientDescentOptimizer(learning_rate)
        self.train = optimizer.minimize(self.loss)	


        sess_config = tf.ConfigProto()
        sess_config.gpu_options.allow_growth = True

        self.sess = sess = tf.Session(config=sess_config)

        sess.run(tf.global_variables_initializer())


    def forward(self, encoded_input):
        Qs = self.sess.run(self.output, 
                           feed_dict={self.input_ph: encoded_input})
        return Qs


    def choose_action(self, encoded_input, task_num, epsilon=epsilon):
        if epsilon > 0 and np.random.rand() < epsilon:
            action = np.random.randint(self.num_actions_per)
        else:
            mask = np.zeros([1, 2*num_output_per], dtype=np.bool)
            mask[0, task_num*num_output_per:(task_num+1)*num_output_per] = 1.
            action = self.sess.run(self.greedy_choice, 
                                   feed_dict={self.input_ph: encoded_input,
                                              self.mask_ph: mask})
        return action


    def run_trial(self, task_num, start_i, goal_j, epsilon, store=False):
        """
        Args:
            store: if True, stores experiences in memory buffer.
        """
        this_graph = self.graphs[task_num]
        curr_loc = start_i
        these_memories = []
        for step in range(1, max_steps_per_trial + 1):
            this_input = encode_one_hot(curr_loc, goal_j, task_num)
            action = self.choose_action(this_input, task_num, epsilon=epsilon) 
            prev_loc = curr_loc
            curr_loc = this_graph.operation(curr_loc, action)
            if curr_loc == goal_j:
                these_memories.append((prev_loc, goal_j, action, curr_loc, 1.))
                break
            else:
                these_memories.append((prev_loc, goal_j, action, curr_loc, 0.))

        if store:
            self.memory_buffer.extend(these_memories) 

        return step 


    def train_on_memories(self, steps, task_num):
        for _ in range(steps):
            index = np.random.randint(len(self.memory_buffer))
            this_memory = self.memory_buffer[index]
            loc, goal, action, next_loc, reward = this_memory
            encoded_input = encode_one_hot(loc, goal, task_num)  
            mask = np.zeros([1, 2 * num_output_per], dtype=np.bool)
            target = np.zeros([1, 2 * num_output_per])
            if reward == 1.:
                target[0, task_num * num_output_per + action] = 1.
            else:
                encoded_next = encode_one_hot(next_loc, goal, task_num)  
                next_Qs = self.forward(encoded_next)
                target[0, task_num * num_output_per + action] = gamma * np.amax(next_Qs)
            mask[0, task_num * num_output_per + action] = 1.

            self.sess.run(self.train, feed_dict={
                self.input_ph: encoded_input,
                self.target_ph: target,
                self.mask_ph: mask
            })
        

    def evaluate_task(self, task_num):
        this_graph = graphs[task_num]
        total_num_steps = 0.
        for start_i in range(self.num_nodes_per):
            for goal_j in range(self.num_nodes_per):
                if start_i == goal_j: 
                    continue
                steps = self.run_trial(task_num, start_i, goal_j, epsilon=0., store=False)
                total_num_steps += steps

        return total_num_steps / (self.num_nodes_per * (self.num_nodes_per - 1))

        
    def train_task(self, task_num, num_trials):
        for trial_i in range(num_trials):
            start_i = np.random.randint(self.num_nodes_per)
            goal_j = np.random.randint(self.num_nodes_per-1)
            if goal_j == start_i:
                goal_j = self.num_nodes_per - 1

            steps = self.run_trial(task_num, start_i, goal_j, epsilon=epsilon, store=True)
            self.train_on_memories(replay_steps_per_trial, task_num)




for run_i in xrange(run_offset, num_runs + run_offset):
    for g1 in graphs: 
        for g2 in graphs: 
            np.random.seed(run_i)
            tf.set_random_seed(run_i)
            model = transfer_model(num_nodes_per, num_output_per, [g1, g2])
            filename_prefix = "g1%s_g2%s_run%i" %(g1.name, g2.name, run_i)
            print("Now running %s" % filename_prefix)
            task_num = 0
            with open("%s%s.csv" % (output_dir, filename_prefix), "w") as fout:
                fout.write("step, task_num, num_actions\n")
                steps = model.evaluate_task(task_num)
                print("%i, %i, %f\n" % (0, task_num, steps))
                fout.write("%i, %i, %f\n" % (0, task_num, steps))
                for step_i in xrange(1, 2 * num_trials):
                    if step_i == num_trials:
                        model.memory_buffer = []
                        task_num = 1
                    model.train_task(task_num, num_trials=1)	
                    if step_i % save_every == 0:
                        steps = model.evaluate_task(task_num)
                        print("%i, %i, %f\n" % (step_i, task_num, steps))
                        fout.write("%i, %i, %f\n" % (step_i, task_num, steps))

            tf.reset_default_graph()
