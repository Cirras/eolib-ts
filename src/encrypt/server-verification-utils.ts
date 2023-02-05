/**
 * This hash function is how the game client checks that it's communicating with a genuine server
 * during connection initialization.
 *
 * @param challenge - the challenge value sent by the client.
 *                    Should be no larger than <code>11,092,110</code>.
 * @returns The hashed challenge value
 *
 * @remarks
 * <ul>
 *   <li>The client sends an integer value to the server in the INIT_INIT client packet, where it
 *       is referred to as the <code>challenge</code>.
 *   <li>The server hashes the value and sends the hash back in the INIT_INIT server packet.
 *   <li>The client hashes the value and compares it to the hash sent by the server.
 *   <li>If the hashes don't match, the client drops the connection.
 * </ul>
 *
 * <h3>Warning</h3>
 * <ul>
 *  <li>Oversized challenges may result in negative hash values, which cannot be represented
 *      properly in the EO protocol.
 * </ul>
 *
 * @see
 * <ul>
 *   <li>{@link InitInitClientPacket.challenge}
 *   <li>{@link InitInitServerPacket.ReplyCodeDataOk.challengeResponse}
 * </ul>
 */
export function serverVerificationHash(challenge: number): number {
  ++challenge;
  return (
    110905 +
    ((challenge % 9) + 1) *
      ((11092004 - challenge) % (((challenge % 11) + 1) * 119)) *
      119 +
    (challenge % 2004)
  );
}
