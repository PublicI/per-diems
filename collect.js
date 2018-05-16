let dsv = require('d3-dsv');
let fs = require('fs');

let path = __dirname + '/cleaned/';

let files = fs.readdirSync(path);

let locations = {};

files.map(file => {
    let data = fs.readFileSync(path + file, 'utf8');

    let rows = dsv.csvParse(data);

    rows.forEach(row => {
        locations[row.Country + '-' + row.Location] = [
            'First 60 Days US$',
            'Per Diem',
            'Total residual',
            'GRAND TOTAL (taxes included)',
            'Amount (Euros)'
        ]
            .map(key => row[key])
            .find(value => value);
    });
});

console.log(locations);
