let dsv = require('d3-dsv');
let fs = require('fs');
let slugify = require('slugify');

let data = fs.readFileSync(__dirname + '/../data/capitals.csv', 'utf8');

let rows = dsv.csvParse(data);

rows = rows.map(row => {
    row.slug = slugify(
        row['Short-form name'].replace(/[*+]*/g, '').replace(/\([^)]+\)/g, '') +
            row.Capital.replace(/\n.*/g, '').replace(/\([^)]+\)/g, ''),
        {
            replacement: '-',
            lower: true
        }
    );

    return row;
});

fs.writeFileSync(
    __dirname + '/../cleaned/capitals.csv',
    dsv.csvFormat(rows),
    'utf8'
);
