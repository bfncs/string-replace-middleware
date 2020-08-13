import { Transform, TransformCallback } from 'stream';
import escapeStringRegexp from 'escape-string-regexp';

type Replacer = {
  matcher: RegExp;
  replace: string;
};

export default function StringReplaceStream(
  replacements: Record<string, string>,
  options?: any
) {
  const replacers: Replacer[] = [];
  const replace = (
    haystack: string,
    replacers: Replacer[],
    replaceBefore: number
  ) => {
    const getBody = (payload: string) => payload.slice(0, replaceBefore);
    const tail = haystack.slice(replaceBefore);
    replacers.forEach(replacer => {
      if (!replacer.matcher.test(haystack)) {
        return;
      }
      haystack =
        getBody(haystack).replace(replacer.matcher, replacer.replace) + tail;
    });
    return [getBody(haystack), tail];
  };
  let tail = '';
  let maxSearchLength = 0;

  options = Object.assign(
    {
      encoding: 'utf8',
      ignoreCase: true,
    },
    options
  );

  Object.keys(replacements)
    .sort((a, b) => b.length - a.length)
    .forEach(search => {
      maxSearchLength = Math.max(maxSearchLength, search.length);
      replacers.push({
        matcher: new RegExp(
          escapeStringRegexp(search),
          options.ignoreCase === false ? 'gm' : 'gmi'
        ),
        replace: replacements[search],
      });
    });

  return new Transform({
    transform: function(
      buf: Buffer,
      _enc: BufferEncoding,
      cb: TransformCallback
    ) {
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
    },
    flush: function(cb) {
      if (tail) {
        const [body] = replace(tail, replacers, tail.length);
        this.push(body);
      }
      cb();
    },
  });
}
