const _ = require('highland');
const { DOMParserMock } = require('./domparsermock');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

global.DOMParser = DOMParserMock;

const pdfjs = require('pdfjs-dist');

pdfjs.disableWorker = true; // is this needed?

function transformItem(viewport, page, item) {
    let transform = pdfjs.PDFJS.Util.transform(
        pdfjs.PDFJS.Util.transform(viewport.transform, item.transform),
        [1, 0, 0, -1, 0, 0]
    );

    return {
        page,
        str: item.str,
        x: transform[4],
        y: transform[5]
    };
}

function processPage(page) {
    let viewport = page.getViewport(1.0);

    return (
        _(page.getTextContent())
            .flatten()
            .pluck('items')
            .flatten()
            .map(transformItem.bind(this, viewport, page.pageIndex + 1))
            // .map(item => _(processItem(item)))
            .flatten()
    );
}

function extractText(docPath) {
    let file = fs.readFileSync(docPath);
/*

    _(
        axios.get(docPath, {
            responseType: 'arraybuffer'
        })
    )
*/
    _(file)
        .map(response => new Uint8Array(response))
        .flatMap(data => _(pdfjs.getDocument(data)))
        .flatMap(doc => {
            const numPages = doc.numPages;
            const pages = [];

            for (let i = 1; i <= numPages; i++) {
                pages.push(i);
            }

            return _(pages).map(page => _(doc.getPage(page)));
        })
        .flatten()
        .flatMap(processPage)
        .group('page')
        .each(result => {
            mkdirp.sync(path.dirname(__dirname + '/../static/data/' + docPath));
            fs.writeFileSync(
                __dirname + '/../static/data/' + docPath.replace('.pdf', '.json'),
                JSON.stringify(result)
            );
        });
}

extractText('docs/UK subsistence rates (valid 2018).pdf');
