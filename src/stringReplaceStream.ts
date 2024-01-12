import { Transform, TransformCallback } from 'stream';
import escapeStringRegexp from 'escape-string-regexp';

/** The replacer string or function passed to string.replace(text: string, replacer: *MatchReplacement*) */
export type MatchReplacement =
  | string
  | ((matchedSubstring: string, ...capturedGroups: string[]) => string);

type Replacer = {
  matcher: RegExp;
  replace: MatchReplacement;
};

type Options = {
  encoding: BufferEncoding;
  ignoreCase: boolean;
  useRegExp: boolean;
};
const defaultOptions: Options = {
  encoding: 'utf8',
  ignoreCase: true,
  useRegExp: false,
};

function buildReplacers(
  replacements: Record<string, MatchReplacement>,
  opts: Options
): Replacer[] {
  return Object.keys(replacements)
    .sort((a, b) => b.length - a.length)
    .map(search => ({
      matcher: new RegExp(
        opts.useRegExp ? search : escapeStringRegexp(search),
        opts.ignoreCase ? 'gmi' : 'gm'
      ),
      replace: replacements[search],
    }));
}

function getMaxSearchLength(
  replacements: Record<string, MatchReplacement>
): number {
  return Object.keys(replacements).reduce(
    (acc, search) => Math.max(acc, search.length),
    0
  );
}

export default function StringReplaceStream(
  replacements: Record<string, MatchReplacement>,
  options: Partial<Options> = {}
) {
  const opts: Options = { ...defaultOptions, ...options };
  const replacers = buildReplacers(replacements, opts);
  const maxSearchLength = getMaxSearchLength(replacements);
  let tail = '';

  const replaceSlidingWindow = (
    haystack: string,
    replacers: Replacer[],
    replaceBefore: number
  ) => {
    /**
     * foo => foo123
     * foo ba | r ba
     * foo123 ba | r baz
     * foo123 | bar baz
     *
     * foo => f
     * foo bar baz => f bar baz
     */
    let body = haystack;
    replacers.forEach(replacer => {
      body =
        body
          .slice(0, replaceBefore)
          .replace(replacer.matcher, replacer.replace as string) +
        body.slice(replaceBefore);
    });

    return [body.slice(0, replaceBefore), body.slice(replaceBefore)];
  };

  const transform = function(
    buf: Buffer,
    _enc: BufferEncoding,
    cb: TransformCallback
  ) {
    const replaceBefore = maxSearchLength * 2;
    const haystack = tail + buf.toString(opts.encoding);
    let body = '';

    if (haystack.length < maxSearchLength * 3 - 2) {
      tail = haystack;
      cb(null, '');
      return;
    }

    [body, tail] = replaceSlidingWindow(haystack, replacers, replaceBefore);

    cb(null, body);
  };
  const flush = function(cb: TransformCallback) {
    if (!tail) {
      cb();
      return;
    }

    const body = replacers.reduce(
      (acc, replacer) =>
        acc.replace(replacer.matcher, replacer.replace as string),
      tail
    );
    cb(null, body);
  };

  return new Transform({ transform, flush });
}
