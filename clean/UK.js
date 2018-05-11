let dsv = require('d3-dsv');
let fs = require('fs');

let data = fs.readFileSync(__dirname + '/../data/UK.csv', 'utf8');

let rows = dsv.csvParseRows(data);

let fields = {};

for (let row of rows) {
    // console.log(row.join('  '));

    let parts = row[0].split(/( {2,}|\n|\r)/g);

    let rowValues = [];

    // country header
    if (parts[0].match(/^[A-Z &]+$/g)) {
        console.log(fields);

        fields = {};
        console.log('== ' + parts[0]);
        rowValues = parts.slice(1).concat(row.slice(1));
    } else {
        rowValues = row;
    }

    let fieldValue = '';
    for (i in rowValues) {
        let fieldName = '';

        // field name
        if (rowValues[i].includes(':') || rowValues[i].includes('Currency')) {
            if (rowValues[i].replace(':', '').trim() !== '') {
                fieldName = rowValues[i].replace(':', '').trim();

                console.log(fieldName);

                if (fieldValue.trim() !== '') {
                    fields[fieldName.trim()] = fieldValue.trim();
                }

                fieldValue = '';
            }
        } else {
            // field value
            fieldValue += rowValues[i];
        }
    }
}
