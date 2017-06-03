let Promise = require('bluebird');
let r = require('request-promise');
let fs = require('fs');
let path = require('path');

let lines = fs.readFileSync(path.resolve(__dirname, 'input.txt'), 'utf-8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => line.replace(/[^a-z0-9 ]+/gi, '')); // allow only alphanum

let key =  fs.readFileSync(path.resolve(__dirname, 'google-api-key.txt'));

Promise.mapSeries(lines, (line) => {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${line}&orderBy=relevance&key=${key}`;
    return r.get(url).then(function(json) {
        return Promise.delay(500).return(json);
    }).then((json) => {
        let results = JSON.parse(json);
        if (results.totalItems === 0) {
            return console.log('/')
        }
        let firstMatch = results.items[0];
        let info = firstMatch.volumeInfo;
        let output = [
            info.title,
            (info.authors || []).join(' / '),
            info.publisher
        ]
        .concat((info.publishedDate || '').split('-').join('\t'))
        .join('\t');
        console.log(output);
    })
})
