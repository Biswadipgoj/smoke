// src/utils/uid.ts
// Row IDs are generated on-device so a write can be inserted, read back and
// referenced before it has ever touched the network (§20, offline-first).
// UUID v4 shape, so the same string is a valid Postgres `uuid` when it syncs.

const HEX = '0123456789abcdef';

function randomHex(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += HEX[Math.floor(Math.random() * 16)];
  }
  return out;
}

/** RFC 4122 version 4 UUID, using Math.random — fine for row IDs, not for secrets. */
export function uid(): string {
  const variant = HEX[8 + Math.floor(Math.random() * 4)]; // 8, 9, a, or b
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${variant}${randomHex(3)}-${randomHex(12)}`;
}
