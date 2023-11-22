import request, { Test } from 'supertest';
import express, { Request, Response } from 'express';
import { stringReplace, Options } from '../src';

function testReplacement(
  replacements: Record<string, string>,
  response: string,
  expectedResponse: string,
  stringReplaceOptions: Partial<Options> = {},
  responseContentType: string = 'text/plain'
): Test {
  const app = express();
  app.use(stringReplace(replacements, stringReplaceOptions));

  const route = '/';
  app.get(route, function(_req: Request, res: Response) {
    res.setHeader('Content-Type', responseContentType);
    res.status(200).send(response);
  });

  return request(app)
    .get(route)
    .expect('Content-Type', new RegExp(`^${responseContentType}`))
    .expect(200, expectedResponse);
}

describe('replacement', () => {
  it('should replace same length strings', () => {
    return testReplacement(
      { foo: 'bar' },
      'foo bar baz qux foo',
      'bar bar baz qux bar'
    );
  });
  it('should replace longer strings', () => {
    return testReplacement(
      { foo: 'foo_replaced', bar: 'bar_replaced' },
      'foo bar baz',
      'foo_replaced bar_replaced baz'
    );
  });
  it('should replace shorter strings', () => {
    return testReplacement({ foo: 'f', bar: 'b' }, 'foo bar baz', 'f b baz');
  });
  it('should replace inside longer text', () => {
    return testReplacement(
      { foo: 'f' },
      'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor foo ut labore et dolore magna aliquyam erat, sed diam voluptua.',
      'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor f ut labore et dolore magna aliquyam erat, sed diam voluptua.'
    );
  });
  it('should replace with relatively long search', () => {
    return testReplacement({ foobar: 'raboof' }, 'foobar!', 'raboof!');
  });
  it('should replace longer strings first, then shorter ones', () => {
    return testReplacement({ baz: 'a', foobar: 'baz' }, 'foobar!', 'a!');
  });
  it('should not touch if nothing matches', () => {
    return testReplacement(
      { foo: 'f', bar: 'b' },
      'Hello world!',
      'Hello world!'
    );
  });
});

describe('content-type allow list', () => {
  it('should not replace on content type mismatch', () => {
    return testReplacement(
      { foo: 'bar' },
      'foo bar baz',
      'foo bar baz',
      {
        contentTypeFilterRegexp: /^application\/octet-stream/,
      },
      'text/plain'
    );
  });
});
