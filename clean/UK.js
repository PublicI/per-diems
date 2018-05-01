let dsv = require('d3-dsv');
let fs = require('fs');

let data = fs.readFileSync(__dirname + '/../data/UK.csv','utf8')

let rows = dsv.csvParseRows(data);

for (let row of rows) {
    let parts = row[0].split(/\W{2,}/g);
    // if (parts)
    if (parts[0].match(/^[A-Z ]+$/g)) {
        console.log(parts[0]);
    }
}
