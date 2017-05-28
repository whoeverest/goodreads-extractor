let r = require('request-promise');

let q = process.argv.slice(2).join('+')
let url = `https://www.googleapis.com/books/v1/volumes?q=${q}&orderBy=relevance`;

console.log(url);

r.get(url).then(function(json) {
    results = JSON.parse(json);
    results.items.forEach((item, i) => {
        info = item.volumeInfo;
        console.log(i, info.title, '(' + (info.authors || []).join('/') + ')');
        console.log(info.publisher);
        console.log((info.publishedDate || '').split('-').join('\t'));
        console.log();
    })
})