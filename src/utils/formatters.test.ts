import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  formatBitrate,
  formatDuration,
  calculateP2PRatio,
  calculateBandwidthSavings,
} from './formatters.js';

test('formatBytes formats various byte sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(-10), '0 B');
  assert.equal(formatBytes(500), '500 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024), '1 MB');
  assert.equal(formatBytes(1536 * 1024), '1.5 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024), '1 GB');
});

test('formatBitrate formats speeds accurately', () => {
  assert.equal(formatBitrate(0), '0 Kbps');
  assert.equal(formatBitrate(500000), '500 Kbps');
  assert.equal(formatBitrate(2500000), '2.5 Mbps');
});

test('formatDuration formats time nicely', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(3665), '01:01:05');
});

test('calculateP2PRatio computes percentage cleanly', () => {
  assert.equal(calculateP2PRatio(0, 0), 0);
  assert.equal(calculateP2PRatio(50, 50), 50);
  assert.equal(calculateP2PRatio(75, 25), 75);
  assert.equal(calculateP2PRatio(100, 0), 100);
});

test('calculateBandwidthSavings calculates GB and estimated dollar cost', () => {
  const result = calculateBandwidthSavings(1024 * 1024 * 1024, 0.08);
  assert.equal(result.savedGb, 1);
  assert.equal(result.estimatedSavingsUsd, 0.08);
});
