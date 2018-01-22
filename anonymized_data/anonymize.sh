#!/bin/bash
subdir=ex0
origin=../data
target=.

mkdir -p ${target}/${subdir}/{aux,s0,s1,s2}

i=1
for f in ${origin}/${subdir}/aux/*.json
do
    filename=$(basename ${f})
    cp ${origin}/${subdir}/aux/${filename} ${target}/${subdir}/aux/ 
    cp ${origin}/${subdir}/s0/${filename} ${target}/${subdir}/s0/ 
    cp ${origin}/${subdir}/s1/${filename} ${target}/${subdir}/s1/ 
    cp ${origin}/${subdir}/s2/${filename} ${target}/${subdir}/s2/ 
done
