import Dexie, { Table } from 'dexie';

Dexie.debug = true;
export interface OfflineScan {
  id?: number;
  lidId: string;
  presensieId: string;
  scan_time: number;
  synced: number;
  lidName?: string;
  tipe: 'in' | 'uit';
  gps?: [number, number];
}

export class InklokDatabase extends Dexie {
  scans!: Table<OfflineScan>;

  constructor() {
    super('InklokDB');
    this.version(1).stores({
      scans: '++id, presensieId, [presensieId+lidId], synced, [presensieId+synced]'
    });
  }
}

export const db = new InklokDatabase();
