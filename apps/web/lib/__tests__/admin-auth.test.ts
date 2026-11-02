import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAdminAuthorized } from '../admin-auth.ts';

const env = { ADMIN_USER: 'nis', ADMIN_PASSWORD: 's3cret:with:colons' };
const basic = (s: string) => `Basic ${Buffer.from(s).toString('base64')}`;

test('accepts the right user and password', () => {
  assert.equal(isAdminAuthorized(basic('nis:s3cret:with:colons'), env), true);
});

test('rejects a wrong password, a wrong user, and a missing or malformed header', () => {
  assert.equal(isAdminAuthorized(basic('nis:wrong'), env), false);
  assert.equal(isAdminAuthorized(basic('admin:s3cret:with:colons'), env), false);
  assert.equal(isAdminAuthorized(null, env), false);
  assert.equal(isAdminAuthorized('Bearer abc', env), false);
  assert.equal(isAdminAuthorized(basic('no-colon-here'), env), false);
});

test('fails closed when the admin env is not set', () => {
  assert.equal(isAdminAuthorized(basic('nis:s3cret:with:colons'), {}), false);
  assert.equal(isAdminAuthorized(basic(':'), { ADMIN_USER: '', ADMIN_PASSWORD: '' }), false);
});
