let dsv = require('d3-dsv');
let fs = require('fs');
let money = require('money');

let path = __dirname + '/cleaned/';

let files = fs.readdirSync(path);

let currency = JSON.parse(fs.readFileSync(path + '../currency.json'));

money.base = currency.base;
money.rates = currency.rates;

let locations = {};

files.map(file => {
    let data = fs.readFileSync(path + file, 'utf8');

    let rows = dsv.csvParse(data);

    rows.forEach(row => {
        let location = '';
        if (row.Location) {
            location =
                row.Location.includes('Other')
                    ? 'Elsewhere'
                    : row.Location.split(' (')[0];
        }

        let slug = (row.Country + '-' + row.Location).toUpperCase();

        if (!(slug in locations)) {
            locations[slug] = {};
        }

        let moneyTotal = [
            'First 60 Days US$',
            'Per Diem',
            'Total residual',
            'GRAND TOTAL (taxes included)',
            'Amount (Euros)'
        ]
            .map(key => row[key])
            .find(value => value);

        if (typeof moneyTotal !== 'undefined') {
            moneyTotal = parseFloat(moneyTotal.replace(',', ''));

            if (row.Currency) {
                let from = row.Currency.match(/\(*[A-Z]{3}\)*/)

                if (from) {
                    from[0]
                        .replace('(', '')
                        .replace(')', '');

                    if (from in currency.rates) {
                        moneyTotal = money.convert(moneyTotal, {
                            from,
                            to: 'USD'
                        });
                    }
                }
            }

            locations[slug][file.replace('.csv', '')] = moneyTotal;
        }
    });
});

let locationRows = [];

Object.keys(locations).forEach(key => {
    locationRows.push({
        slug: key,
        ...locations[key]
    });
});

console.log(dsv.csvFormat(locationRows));
