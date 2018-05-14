let dsv = require('d3-dsv');
let fs = require('fs');

let data = fs.readFileSync(__dirname + '/../data/UK.csv', 'utf8');

let rows = dsv.csvParseRows(data);

let cleanedRows = [];

let fields = null;

for (let row of rows) {
    // console.log(row.join('  '));

    let rowValues = [];

    for (i in row) {
        let parts = row[i].split(/( {2,}|\n|\r)/g);

        for (i2 in parts) {
            rowValues.push(parts[i2]);
        }
    }

    // country header
    if (rowValues[0].trim().match(/^[A-Z &"]+$/g)) {
        if (fields) {
            cleanedRows.push(fields);
        }

        fields = {};
        fields['Country'] = rowValues[0].replace('"', '');
    }

    let fieldValue = '';
    let fieldName = '';
    for (i in rowValues) {
        // field name
        if (rowValues[i].includes(':') || rowValues[i].includes('Currency')) {
            if (rowValues[i].replace(':', '').trim() !== '') {
                fieldName = rowValues[i].replace(':', '').trim();

                // console.log(fieldName);

                if (fieldValue.trim() !== '') {
                    fields[fieldName.trim()] = fieldValue.trim();
                }

                fieldValue = '';
            }
        } else if (fieldName.trim() !== '') {
            // field value
            fieldValue += rowValues[i];
        }
    }

    if (fieldName.trim() !== '' && fieldValue.trim() !== '') {
        fields[fieldName.trim()] = fieldValue.trim();
    }
}

console.log(cleanedRows);
