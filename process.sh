#!/bin/bash

node ./clean/Canada
node ./clean/UK
node ./clean/UN
echo "Country,Location,Season Code,Season Start Date,Season End Date,Lodging,Meals & Incidentals,Per Diem,Effective Date ,Footnote Reference,Location Code" > ./cleaned/US.csv
tail -n +2 ./data/US.csv >> ./cleaned/US.csv
cp ./data/EU.csv ./cleaned/EU.csv
node collect > results.csv
