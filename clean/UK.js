let csv = require('csv-parser');
let fs = require('fs');

fs
    .createReadStream(__dirname + '/../data/UK.csv')
    .pipe(csv())
    .on('data', function(data) {
        console.log(data);
    });
