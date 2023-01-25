import { ProtocolCodeGenerator } from "./protocol-code-generator/src";

let generator = new ProtocolCodeGenerator(`${__dirname}/eo-protocol`);
generator.generate(`${__dirname}/../generated`);
