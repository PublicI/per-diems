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

function extractMoneyValue(value) {
    if (!value) {
        return NaN;
    }
    let result = parseFloat(value.replace(/[^0-9.]*/g, ''));
    return result;
}

function extractCurrencyCode(value) {
    if (!value) {
        return null;
    }
    let matches = value.match(/\(*[A-Z]{3}\)*/);
    let code = matches ? matches[0].replace('(', '').replace(')', '') : null;
    return code in currency.rates ? code : null;
}

function cleanMoney(code, value) {
    if (typeof value === 'undefined' || value == '*') {
        return NaN;
    }

    let currencyCode = extractCurrencyCode(code);
    let moneyValue = extractMoneyValue(value);

    if (!isNaN(moneyValue)) {
        if (currencyCode) {
            return money.convert(moneyValue, {
                from: currencyCode,
                to: 'USD'
            });
        } else {
            return moneyValue;
        }
    } else {
        return NaN;
    }
}

function processLocation(country, location) {}

function processRow(locations, file, row) {
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

    let currencyCode = row.Currency;

    // but if the column header says this should be in dollars, respect that
    if (row['First 60 Days US$']) {
        currencyCode = null;
    }
    // if the column header says this should be in Euros, respect that
    if (row['Amount (Euros)']) {
        currencyCode = 'EUR';
    }

    moneyTotal = cleanMoney(currencyCode, moneyTotal);

    // if we're in the UK, add the room rate after possible conversion
    let roomRate = processMoney(
        row['Room rate'] + ' ' + row.Currency,
        row['Room rate']
    );
    moneyTotal += !isNaN(roomRate) ? roomRate : 0;

    // store the rate in its corresponding map location
    if (!isNaN(moneyTotal)) {
        locations[slug][file.replace('.csv', '')] = moneyTotal;
    }

    // include US meals & incidentals as a separate column for comparison to Canada
    if ('Meals & Incidentals' in row) {
        locations[slug]['US meals & incidentals'] = processMoney(
            null,
            row['Meals & Incidentals']
        );
    }
}

function processFile(locations, file) {
    let data = fs.readFileSync(path + file, 'utf8');

    // strip UTF8 byte order mark, see https://github.com/nodejs/node-v0.x-archive/issues/1918
    data = data.replace(/^\uFEFF/, '');

    // parse CSVs
    let rows = dsv.csvParse(data);

    // for each row, representing a per diem rate...
    rows.forEach(processRow.bind(this, locations, file));
}

// read all the files in /cleaned/ in one by one
// each one corresponds to a jurisdiction like Canada, etc. that sets per diems
files.forEach(processFile.bind(this, locations));

// flatten the two layer map structure into an array of objects
let locationRows = [];

Object.keys(locations).forEach(key => {
    locationRows.push({
        slug: key,
        ...locations[key]
    });
});

// output the result in CSV format
console.log(
    dsv.csvFormat(locationRows, [
        'slug',
        'EU',
        'UN',
        'US',
        'US meals & incidentals',
        'Canada',
        'UK'
    ])
);
