let dsv = require('d3-dsv');
let fs = require('fs');

let data = fs.readFileSync(__dirname + '/../data/UN.csv', 'utf8');

let rows = dsv.csvParseRows(data);

let country = '';
let currency = '';

rows = rows
    .map(row => {
        if (row[0] == 'Country/Area (Currency)') {
            row.shift();
            row.unshift('Location');
            row.unshift('Currency');
            row.unshift('Country');
        }
        else if (row[1] === '') {
            country = row[0].split(' (')[0];
            currency = row[0].split(' (')[1].replace(')', '');
        } else {
            row.unshift(currency);
            row.unshift(country);
        }

        return row;
    })
    .filter(row => row[1] !== '');

fs.writeFileSync(
    __dirname + '/../cleaned/UN.csv',
    dsv.csvFormatRows(rows),
    'utf8'
);
