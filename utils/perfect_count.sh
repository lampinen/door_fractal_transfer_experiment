#!/bin/bash
experiment=ex4_cont
session=s0


cd ../data/${experiment}/${session}/
for f in *.json; do
    echo $f
    grep -o '\"perfect\":true' $f | wc -l
    grep ${f%.*} ../../../mturk/${experiment}/${session}*/production-results/*.json
done
cd ~-
