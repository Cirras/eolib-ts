import { PacketAction } from "@eolib/protocol/net/packet-action.js";
import { PacketFamily } from "@eolib/protocol/net/packet-family.js";
import { EoWriter } from "@eolib/data/eo-writer.js";

export interface Packet {
  /**
   * The packet family associated with this packet.
   */
  family: PacketFamily;

  /**
   * The packet action associated with this packet.
   */
  action: PacketAction;

  /**
   * Serializes this packet to the provided `EOWriter`.
   *
   * @param writer - the writer that this packet will be serialized to
   */
  serialize(writer: EoWriter): void;
}
