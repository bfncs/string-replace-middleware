const hijackResponse = require('hijackresponse');
const stringReplaceStream = require('./stringReplaceStream');

const defaultOptions = {
  contentTypeFilterRegexp: /^text\/|^application\/json$|^application\/xml$/,
}

module.exports = (replacements, options = defaultOptions ) => (req, res, next) => {
    hijackResponse(res, function (err, res) {
        const contentType = res.get('content-type') || "";
        if (contentType.match(options.contentTypeFilterRegexp)) {
            if (err) {
                res.unhijack(); // Make the original res object work again
                return next(err);
            }
            res.removeHeader('Content-Length');
            res
                .pipe(stringReplaceStream(replacements))
                .pipe(res);
        } else {
            res.pipe(res);
        }
    });
    next();
};