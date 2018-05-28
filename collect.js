let dsv = require('d3-dsv');
let fs = require('fs');
let money = require('money');
let slugify = require('slugify');

// get a list of files in /cleaned/
let path = __dirname + '/cleaned/';

let files = fs.readdirSync(path);

// read in currencies from JSON file originally from https://data.fixer.io/api/latest
// (has since been modified with additional currencies/currency codes)
let currency = JSON.parse(fs.readFileSync(path + '../currency.json'));

money.base = currency.base;
money.rates = currency.rates;

// set up map we'll keep the locations in
let locations = {};

// read all the files in /cleaned/ in one by one
// each one corresponds to a jurisdiction like Canada, etc. that sets per diems
files.map(file => {
    let data = fs.readFileSync(path + file, 'utf8');

    // strip UTF8 byte order mark, see https://github.com/nodejs/node-v0.x-archive/issues/1918
    data = data.replace(/^\uFEFF/, '');

    // parse CSVs
    let rows = dsv.csvParse(data);

    // for each row, representing a per diem rate...
    rows.forEach(row => {
        // set up empty string for location, if there isn't one we'll use this instead
        // each row has a field named country and one called location
        // we need to use these to match per diem rates, but they're messy
        // so we're going to clean them up
        let location = '';

        // remove catch-alls like other, elsewhere, all areas and the name of the country
        // remove parentheticals
        if (row.Location) {
            location =
                row.Location.includes('Other') ||
                row.Location.includes('Elsewhere') ||
                row.Location.includes('All Areas') ||
                row.Location.toUpperCase().includes(row.Country.toUpperCase())
                    ? ''
                    : '-' + row.Location.split(' (')[0];
        }

        // convert the country and location to a lowercase slug like afghanistan-kabul
        let slug = slugify(row.Country + location, {
            replacement: '-',
            lower: true
        });

        // if the slug isn't in the locations map yet, add an empty object for it 
        if (!(slug in locations)) {
            locations[slug] = {};
        }

        // find the field that corresponds to the per diem for this particular jurisidiction
        let moneyTotal = [
            'First 60 Days US$',
            'Per Diem',
            'Total residual',
            'GRAND TOTAL (taxes included)',
            'Amount (Euros)'
        ]
            .map(key => row[key])
            .find(value => value);

        // if we have a rate and it's the first season (the U.S. government pays by seasons)
        // then we'll try to process this per diem
        if (
            typeof moneyTotal !== 'undefined' &&
            moneyTotal !== '*' &&
            (!row['Season Code'] || row['Season Code'] === 'S1')
        ) {
            // convert the rate to a float
            moneyTotal = parseFloat(moneyTotal.replace(',', ''));

            // if the column header says this should be in Euros, respect that
            if (row['Amount (Euros)']) {
                row.Currency = 'EUR';
            }

            if (row.Currency) {
                // find the currency code
                let from = row.Currency.match(/\(*[A-Z]{3}\)*/);

                // but if the column header says this should be in dollars, respect that
                if (row['First 60 Days US$']) {
                    from = null;
                }

                // if we found a three letter currency code...
                if (from) {
                    // no parens allowed
                    from = from[0].replace('(', '').replace(')', '');

                    // and if the currency code is in our JSON of rates
                    if (from in currency.rates) {
                        // convert it to USD
                        moneyTotal = money.convert(moneyTotal, {
                            from,
                            to: 'USD'
                        });
                    } else {
                        // otherwise, throw an error
                        console.error(from + ' not in rates');
                    }
                }
            }

            // store the rate in its corresponding map location
            locations[slug][file.replace('.csv', '')] = moneyTotal;
        }
    });
});

// flatten the two layer map structure into an array of objects
let locationRows = [];

Object.keys(locations).forEach(key => {
    locationRows.push({
        slug: key,
        ...locations[key]
    });
});

// output the result in CSV format
console.log(dsv.csvFormat(locationRows));
