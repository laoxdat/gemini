import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidHlsUrl,
  isValidTrackerUrl,
  isValidIceServerUrl,
  generateSwarmId,
} from './config.js';

test('isValidHlsUrl checks m3u8 format correctly', () => {
  assert.equal(isValidHlsUrl('https://example.com/live/index.m3u8'), true);
  assert.equal(isValidHlsUrl('https://example.com/stream.m3u8?token=xyz'), true);
  assert.equal(isValidHlsUrl('ftp://example.com/stream.m3u8'), false);
  assert.equal(isValidHlsUrl('not-a-url'), false);
  assert.equal(isValidHlsUrl(''), false);
});

test('isValidTrackerUrl validates websocket protocols', () => {
  assert.equal(isValidTrackerUrl('wss://tracker.openwebtorrent.com'), true);
  assert.equal(isValidTrackerUrl('ws://localhost:8000'), true);
  assert.equal(isValidTrackerUrl('https://tracker.com'), false);
  assert.equal(isValidTrackerUrl('udp://tracker.openbittorrent.com:80'), false);
});

test('isValidIceServerUrl validates stun and turn schemes', () => {
  assert.equal(isValidIceServerUrl('stun:stun.l.google.com:19302'), true);
  assert.equal(isValidIceServerUrl('stuns:stun.l.google.com:19302'), true);
  assert.equal(isValidIceServerUrl('turn:turn.example.com:3478'), true);
  assert.equal(isValidIceServerUrl('turns:turn.example.com:3478'), true);
  assert.equal(isValidIceServerUrl('http://stun.com'), false);
});

test('generateSwarmId returns custom id when provided or deterministic hash', () => {
  assert.equal(generateSwarmId('https://example.com/test.m3u8', 'my-swarm'), 'my-swarm');
  const generated = generateSwarmId('https://example.com/test.m3u8');
  assert.ok(generated.startsWith('p2p-swarm-'));
  assert.equal(generateSwarmId('https://example.com/test.m3u8'), generated);
});
