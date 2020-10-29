export default class PPLink {
  id: number;
  type: string;
  origin_id: number;
  origin_slot: number;
  target_id: number;
  target_slot: number;

  constructor(id, type, origin_id, origin_slot, target_id, target_slot) {
    this.id = id;
    this.type = type;
    this.origin_id = origin_id;
    this.origin_slot = origin_slot;
    this.target_id = target_id;
    this.target_slot = target_slot;
  }
}
