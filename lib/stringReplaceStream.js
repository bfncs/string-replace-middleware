const Transform = require('stream').Transform;
const escapeStringRegexp = require('escape-string-regexp');

module.exports = function StringReplaceStream(replacements, options) {
    const replacers = [];
    const replace = (haystack, replacers, replaceBefore) => {
        const getBody = haystack => haystack.slice(0, replaceBefore);
        const tail = haystack.slice(replaceBefore);
        replacers.forEach(replacer => {
            if (!replacer.matcher.test(haystack)) {
                return;
            }
            haystack = getBody(haystack).replace(replacer.matcher, replacer.replace) + tail;
        });
        return [getBody(haystack), tail];
    };
    let tail = '';
    let maxSearchLength = 0;

    options = Object.assign({
        encoding: 'utf8',
        ignoreCase: true
    }, options);

    Object.keys(replacements)
        .sort((a, b) => (b.length - a.length))
        .forEach(search => {
            maxSearchLength = Math.max(maxSearchLength, search.length);
            replacers.push({
                matcher: new RegExp(escapeStringRegexp(search), options.ignoreCase === false ? 'gm' : 'gmi'),
                replace: replacements[search]
            });
        });

    function transform(buf, enc, cb) {
        const replaceBefore = maxSearchLength * 2;
        let haystack = tail + buf.toString(options.encoding);
        let body = '';

        if (haystack.length < maxSearchLength * 3 - 2) {
            tail = haystack;
            cb(null, '');
            return;
        }

        [body, tail] = replace(haystack, replacers, replaceBefore);

        cb(null, body);
    }

    function flush(cb) {
        if (tail) {
            const [body, ...omit] = replace(tail, replacers, tail.length);
            this.push(body);
        }
        cb();
    }

    return new Transform({
        transform: transform,
        flush: flush
    });
};
