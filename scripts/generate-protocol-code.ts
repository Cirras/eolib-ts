import { ProtocolCodeGenerator } from "./protocol-code-generator/src/index";

let generator = new ProtocolCodeGenerator(`${__dirname}/eo-protocol/xml`);
generator.generate(`${__dirname}/../generated`);
