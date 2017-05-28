let Promise = require('bluebird');
let r = require('request-promise');
let fs = require('fs');
let path = require('path');

let lines = fs.readFileSync(path.resolve(__dirname, 'input.txt'), 'utf-8').split('\n').filter((el) => el !== '');

Promise.mapSeries(lines, (line) => {
    let url = `https://www.googleapis.com/books/v1/volumes?q=${line}&orderBy=relevance`;
    return r.get(url).then(function(json) {
        let results = JSON.parse(json);
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
