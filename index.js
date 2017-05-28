let Promise = require('bluebird');
let cheerio = require('cheerio');
let r = require('request-promise');
let fs = require('fs');
let path = require('path');

function getRetry(url, attLeft) {
    console.error('Getting book with url:', url, '(first try)');
    if (attLeft === undefined) {
        attLeft = 3;
    }
    return r.get(url).catch(function(e) {
        if (attLeft) {
            console.error('Retrying for url:', url, 'attempts left:', attLeft);
            return getRetry(url, attLeft - 1);
        }
        console.error('Giving up for url:', url);
        throw e;
    })
}

function parseList(html) {
    let $ = cheerio.load(html);
    let books = $('.tableList tr');
    let listTitle = $('.listPageTitle').text().trim();
    return books.map(function(i, el) {
        let title = $(el).find('.bookTitle').text().trim().replace(/\((.)*\)$/, '').trim();
        let url = $(el).find('.bookTitle').attr('href');
        let author = $(el).find('.authorName').text().trim();
        return {
            n: i,
            list: listTitle,
            title: title,
            author: author,
            url: 'https://www.goodreads.com' + url
        };
    }).toArray();
}

function parseDetails(html) {
    let $ = cheerio.load(html);
    let details = $("#details .row").text().split('\n')
        .map(function(el) { return el.trim() })
        .filter(function(el) { return el !== '' })
        .map(function(el) { if (el.starsWith('by ')) { return el.replace('by ', '') } else { return el } });
    return details;
}

let url = process.argv[2];

if (!url) {
    console.error('Usage:');
    console.error('  node index.js https://goodreads.com/list/...');
    process.exit(1);
}

let ONLY_FIRST_N_BOOKS = 40;
let OUT_DIR = path.resolve(__dirname, 'out');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR)
}

console.error('List url:\n  ', url);
console.error('Starting...');

r.get(url).then((html) => {
    console.error('Fetched list.')
    let list = parseList(html);
    if (list.length > ONLY_FIRST_N_BOOKS) {
        console.error('List is longer than', ONLY_FIRST_N_BOOKS, 'books, discarding the last', list.length - ONLY_FIRST_N_BOOKS, 'books.');
        list = list.slice(0, ONLY_FIRST_N_BOOKS);
    }
    return Promise.map(list, function(item) {
        item.publishDetails = getRetry(item.url).then(function(html) {
            console.error('OK:', item.url);
            return parseDetails(html);
        });
        return Promise.props(item);
    });
}).then(function(results) {
    let books = results.map(function(book) {
        return [book.list, book.author, book.title].concat(book.publishDetails).join('\t'); // tsv row
    });
    let listFilename = results[0].list.replace(/\s/g, '-');
    let output = books.join('\n'); // full tsv
    fs.writeFileSync(path.resolve(OUT_DIR, listFilename + '.csv'), output);
    console.error('Done!');
    process.exit(0);
});
