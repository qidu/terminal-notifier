import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, ArgError } from '../dist/args.js';

test('parses value flags', () => {
  const args = parseArgs([
    '-message', 'hello',
    '-title', 'World',
    '-sound', 'default',
    '-ask', 'Continue?',
  ]);
  assert.equal(args.message, 'hello');
  assert.equal(args.title, 'World');
  assert.equal(args.sound, 'default');
  assert.equal(args.ask, 'Continue?');
  assert.equal(args.help, false);
  assert.equal(args.version, false);
});

test('parses inline -flag=value', () => {
  const args = parseArgs(['-message=hi there', '-open=http://example.com']);
  assert.equal(args.message, 'hi there');
  assert.equal(args.open, 'http://example.com');
});

test('parses boolean flags', () => {
  assert.equal(parseArgs(['-help']).help, true);
  assert.equal(parseArgs(['-version']).version, true);
});

test('rejects unknown flags', () => {
  assert.throws(() => parseArgs(['-nope', 'x']), ArgError);
});

test('rejects missing flag value', () => {
  assert.throws(() => parseArgs(['-message']), ArgError);
});

test('rejects bare positional arguments', () => {
  assert.throws(() => parseArgs(['stray']), ArgError);
});

test('empty argv yields unset message', () => {
  const args = parseArgs([]);
  assert.equal(args.message, undefined);
  assert.equal(args.help, false);
});
