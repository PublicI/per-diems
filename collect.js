let dsv = require('d3-dsv');
let fs = require('fs');
let money = require('money');
let slugify = require('slugify');

let path = __dirname + '/cleaned/';

let files = fs.readdirSync(path);

let currency = JSON.parse(fs.readFileSync(path + '../currency.json'));

money.base = currency.base;
money.rates = currency.rates;

let locations = {};

files.map(file => {
    let data = fs.readFileSync(path + file, 'utf8');

    data = data.replace(/^\uFEFF/, ''); // strip UTF8 byte order mark, see https://github.com/nodejs/node-v0.x-archive/issues/1918

    let rows = dsv.csvParse(data);

    rows.forEach(row => {
        let location = '';
        if (row.Location) {
            location =
                row.Location.includes('Other') ||
                row.Location.includes('Elsewhere') ||
                row.Location.includes('All Areas') ||
                row.Location.toUpperCase().includes(row.Country.toUpperCase())
                    ? ''
                    : '-' + row.Location.split(' (')[0];
        }

        let slug = slugify(row.Country + location, {
            replacement: '-',
            lower: true
        });

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

        if (
            typeof moneyTotal !== 'undefined' &&
            moneyTotal !== '*' &&
            (!row['Season Code'] || row['Season Code'] === 'S1')
        ) {
            moneyTotal = parseFloat(moneyTotal.replace(',', ''));

            if (row['Amount (Euros)']) {
                row.Currency = 'EUR';
            }

            if (row.Currency) {
                let from = row.Currency.match(/\(*[A-Z]{3}\)*/);

                if (row['First 60 Days US$']) {
                    from = null;
                }

                if (from) {
                    from = from[0].replace('(', '').replace(')', '');

                    if (from in currency.rates) {
                        moneyTotal = money.convert(moneyTotal, {
                            from,
                            to: 'USD'
                        });
                    } else {
                        console.error(from + ' not in rates');
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
