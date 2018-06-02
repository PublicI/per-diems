let dsv = require('d3-dsv');
let fs = require('fs');
let money = require('money');
let slugify = require('slugify');
let _ = require('lodash');

let path = __dirname + '/cleaned/';

let files = fs.readdirSync(path);

// read in currencies from JSON file originally from https://data.fixer.io/api/latest
// (has since been modified with additional currencies/currency codes)
let currency = JSON.parse(fs.readFileSync(__dirname + '/currency.json'));

money.base = currency.base;
money.rates = currency.rates;

function cleanMoneyValue(value) {
    if (!value) {
        return NaN;
    }
    let result = parseFloat(value.replace(/[^0-9.]*/g, ''));
    return result;
}

function cleanCurrencyCode(value) {
    if (!value) {
        return null;
    }
    let matches = value.match(/\(*[A-Z]{3}\)*/);
    let code = matches ? matches[0].replace('(', '').replace(')', '') : null;
    return code in currency.rates ? code : null;
}

function cleanMoney(code, value) {
    if (value === null || typeof value === 'undefined' || value == '*') {
        return NaN;
    }

    let currencyCode = cleanCurrencyCode(code);
    let moneyValue = cleanMoneyValue(value);

    if (!isNaN(moneyValue)) {
        return money.convert(moneyValue, {
            from: currencyCode ? currencyCode : 'USD',
            to: 'USD'
        });
    } else {
        return NaN;
    }
}

function calcTotal(row) {
    // find the field that corresponds to the per diem for this particular jurisidiction
    let total = [
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
    if (row['Amount (Euros)']) {
        currencyCode = 'EUR';
    }

    total = cleanMoney(currencyCode, total);

    // if we're in the UK, add the room rate after possible conversion
    let roomRate = cleanMoney(
        row['Room rate'] + ' ' + row.Currency,
        row['Room rate']
    );
    total += !isNaN(roomRate) ? roomRate : 0;

    return total;
}

function slugLocation(row) {
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
            row.Location.toUpperCase() == row.Country.toUpperCase()
                ? ''
                : '-' + row.Location.split(' (')[0];
    }

    // convert the country and location to a lowercase slug like afghanistan-kabul
    let slug = slugify(row.Country + location, {
        replacement: '-',
        lower: true
    });

    return slug;
}

function processRow(jurisdiction, row) {
    return {
        jurisdiction: jurisdiction,
        slug: slugLocation(row),
        total: calcTotal(row),
        mealsAndIncidentals: cleanMoney(null, row['Meals & Incidentals'])
    };
}

function processFile(file) {
    let data = fs.readFileSync(path + file, 'utf8');

    // strip UTF8 byte order mark, see https://github.com/nodejs/node-v0.x-archive/issues/1918
    data = data.replace(/^\uFEFF/, '');

    // parse CSVs
    let rows = dsv.csvParse(data);

    let jurisdiction = file.replace('.csv', '');

    // for each row, representing a per diem rate...
    return rows
        .map(processRow.bind(this, jurisdiction))
        .filter(
            result => !isNaN(result.total) || !isNaN(result.mealsAndIncidentals)
        );
}

function flattenLocations() {

}

// read all the files in /cleaned/ in one by one
// each one corresponds to a jurisdiction like Canada, etc. that sets per diems
let locations = _(files)
    .flatMap(processFile)
    .groupBy('slug')
    .value();

locations = Object.keys(locations).map(key => {
    let result = _(locations[key])
        .groupBy('jurisdiction')
        .mapValues(d => d[d.length - 1].total)
        .value();

    let mealsAndIncidentals = locations[key].find(
        loc => !isNaN(loc.mealsAndIncidentals) && loc.jurisdiction === 'US'
    );

    if (mealsAndIncidentals) {
        result['US meals & incidentals'] = mealsAndIncidentals.mealsAndIncidentals;
    }

    return {
        slug: key,
        ...result
    };
});

// output the result in CSV format
console.log(
    dsv.csvFormat(locations, [
        'slug',
        'EU',
        'UN',
        'US',
        'US meals & incidentals',
        'Canada',
        'UK'
    ])
);
