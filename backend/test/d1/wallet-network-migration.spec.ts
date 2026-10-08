import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { ParseUUIDPipe } from '@nestjs/common';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

it('repairs seeded network identifiers without losing configuration or address links', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON; CREATE TABLE Currency (id INTEGER PRIMARY KEY, symbol TEXT UNIQUE, name TEXT, depositEnabled INTEGER, withdrawEnabled INTEGER, isActive INTEGER, createdAt TEXT, updatedAt TEXT); CREATE TABLE DepositAddress (id TEXT PRIMARY KEY, currencyId INTEGER, network TEXT, isActive INTEGER);');
    db.exec(readFileSync('prisma/migrations-d1/0012_wallet_network_authority.sql','utf8'));
    const first = db.prepare('SELECT id FROM WalletNetwork LIMIT 1').get();
    const invalid = '8531f73f-2597-a091-121b-f1b27e54b8d2';
    db.prepare('UPDATE WalletNetwork SET id=?, isActive=1, notice=? WHERE id=?').run(invalid,'TEST_ONLY',first.id);
    db.prepare('INSERT INTO DepositAddress (id,currencyId,network,walletNetworkId) SELECT ?,currencyId,code,id FROM WalletNetwork WHERE id=?').run('existing-address',invalid);
    const repair = readFileSync('prisma/migrations-d1/0013_wallet_network_uuid_repair.sql','utf8');
    db.exec(repair);
    const networks = db.prepare('SELECT * FROM WalletNetwork').all();
    expect(networks).toHaveLength(8);
    for (const row of networks) await expect(new ParseUUIDPipe().transform(row.id,{type:'param'})).resolves.toBe(row.id);
    const linked = db.prepare('SELECT w.isActive,w.notice,w.id FROM WalletNetwork w JOIN DepositAddress d ON d.walletNetworkId=w.id').get();
    expect(linked).toMatchObject({isActive:1,notice:'TEST_ONLY',id:'8531f73f-2597-4091-821b-f1b27e54b8d2'});
    db.exec(repair);
    expect(db.prepare('SELECT * FROM WalletNetwork').all()).toEqual(networks);
  } finally { db.close(); }
});
