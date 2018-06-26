#!/bin/bash
for f in *.json; do echo $f; grep -o '\"perfect\":true' $f | wc -l; done
