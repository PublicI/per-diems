let dsv = require('d3-dsv');
let fs = require('fs');

let data = fs.readFileSync(__dirname + '/../data/UK.csv', 'utf8');

let rows = dsv.csvParseRows(data);

let cleanedRows = [];

let fields = null;
let firstRow = false;
let noTable = false;

for (let row of rows) {
    // console.log(row.join('  '));

    let rowValues = [];

    for (i in row) {
        let parts = row[i].split(/[\r\n ]{2,}/g);

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

        firstRow = true;

        if (
            rowValues.length > 1 &&
            rowValues[1].trim() !== '' &&
            !rowValues[1].includes('Currency')
        ) {
            fields['Location'] = rowValues[1].trim().replace('"', '');
        }
    } else if (firstRow) {
        firstRow = false;

        if (rowValues[0].trim() !== '' && !fields.Location) {
            fields['Location'] = rowValues[0].trim().replace('"', '');
        }

        if (!fields.Currency) {
            noTable = true;
        }
    } else if (noTable) {
        noTable = false;

        if (rowValues[0].trim() !== '') {
            fields['Note'] = rowValues[0].trim();
        }
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

cleanedRows = cleanedRows.map((fields) => {
    if (fields.Currency) {
        fields.Currency = fields.Currency.replace(
            ' (unless stated otherwise)',
            ''
        );
    }

    if (fields.Breakfast) {
        fields.Breakfast = fields.Breakfast.replace(
            ' (included in room rate)',
            ''
        );
    }

    return fields;
});

fs.writeFileSync(__dirname + '/../cleaned/UK.csv', dsv.csvFormat(cleanedRows), 'utf8');
