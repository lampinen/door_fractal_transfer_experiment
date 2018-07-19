#!/bin/bash
experiment=ex5
session=s2

cd ../mturk/${experiment}/
for d in ${session}*; do
    cd $d
    python /home/andrew/Documents/grad/res/mturk/my_cosub/cosub/cosub/runner.py download -p
    cd ..
done
cd ../../


cd ./data/${experiment}/${session}/
for f in *.json; do
    echo $f
    grep -o '\"perfect\":true' $f | wc -l
    grep ${f%.*} ../../../mturk/${experiment}/${session}*/production-results/*.json
done
cd ../../../utils
