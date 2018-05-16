let dsv = require('d3-dsv');
let fs = require('fs');

let data = fs.readFileSync(__dirname + '/../data/Canada.csv', 'utf8');

let rows = dsv.csvParseRows(data);

let country = '';
let currency = '';

let headers = [
    'Country',
    'Currency',
    'Location',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Total Meals',
    'Incidental Amount',
    'GRAND TOTAL (taxes included)'
];

rows = rows
    .map(row => {
        if (row[1] === '') {
            country = row[0].split(/ – Currency:\W/)[0];
            currency = row[0].split(/ – Currency:\W/)[1];
        } else {
            row.unshift(currency);
            row.unshift(country);
        }

        return row;
    })
    .filter(row => row[1] !== '')
    .slice(3);

rows.unshift(headers);

fs.writeFileSync(
    __dirname + '/../cleaned/Canada.csv',
    dsv.csvFormatRows(rows),
    'utf8'
);
