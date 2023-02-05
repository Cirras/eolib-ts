import {
  deinterleave,
  flipMsb,
  interleave,
  swapMultiples,
} from "@eolib/encrypt/encryption-utils";

import * as windows1252 from "windows-1252";

describe("interleave()", function () {
  const TEST_DATA = [
    {
      input: "Hello, World!",
      interleaved: "H!edlllroo,W ",
    },
    {
      input: "We're ¼ of the way there, so ¾ is remaining.",
      interleaved: "W.eg'nrien i¼a moefr  tshie  ¾w aoys  t,heer",
    },
    {
      input: "64² = 4096",
      interleaved: "6649²0 4= ",
    },
    {
      input: "© FÒÖ BÃR BÅZ 2014",
      interleaved: "©4 1F0Ò2Ö  ZBÅÃBR ",
    },
    {
      input: 'Öxxö Xööx "Lëïth Säë" - "Ÿ"',
      interleaved: 'Ö"xŸx"ö  -X ö"öëxä S" Lhëtï',
    },
    {
      input: "Padded with 0xFFÿÿÿÿÿÿÿÿ",
      interleaved: "Pÿaÿdÿdÿeÿdÿ ÿwÿiFtFhx 0",
    },
    {
      input: "This string contains NUL\0 (value 0) and a € (value 128)",
      interleaved: "T)h8i2s1  seturlianvg(  c€o nat adinnas  )N0U Le\0u l(av",
    },
  ];

  TEST_DATA.forEach((data) => {
    it(`should interleave "${data.input}" to "${data.interleaved}"`, function () {
      const bytes = toBytes(data.input);
      interleave(bytes);
      expect(bytes).toStrictEqual(toBytes(data.interleaved));
    });
  });
});

describe("deinterleave()", function () {
  const TEST_DATA = [
    {
      input: "Hello, World!",
      deinterleaved: "Hlo ol!drW,le",
    },
    {
      input: "We're ¼ of the way there, so ¾ is remaining.",
      deinterleaved: "W'e¼o h a hr,s  srmiig.nnae i¾o eetywetf  re",
    },
    {
      input: "64² = 4096",
      deinterleaved: "6²=4960  4",
    },
    {
      input: "© FÒÖ BÃR BÅZ 2014",
      deinterleaved: "©FÖBRBZ2140 Å Ã Ò ",
    },
    {
      input: 'Öxxö Xööx "Lëïth Säë" - "Ÿ"',
      deinterleaved: 'Öx öx"ët ä"-""Ÿ  ëShïL öXöx',
    },
    {
      input: "Padded with 0xFFÿÿÿÿÿÿÿÿ",
      deinterleaved: "Pde ih0FÿÿÿÿÿÿÿÿFx twdda",
    },
    {
      input: "This string contains NUL\0 (value 0) and a € (value 128)",
      deinterleaved: "Ti tigcnan U\0(au )ada€(au 2)81elv   n 0elv LNsito nrssh",
    },
  ];

  TEST_DATA.forEach((data) => {
    it(`should interleave "${data.input}" to "${data.deinterleaved}"`, function () {
      const bytes = toBytes(data.input);
      deinterleave(bytes);
      expect(bytes).toStrictEqual(toBytes(data.deinterleaved));
    });
  });
});

describe("flipMsb()", function () {
  const TEST_DATA = [
    {
      input: "Hello, World!",
      flipped: "Èåììï¬\u00A0×ïòìä¡",
    },
    {
      input: "We're ¼ of the way there, so ¾ is remaining.",
      flipped:
        "×å§òå\u00A0<\u00A0ïæ\u00A0ôèå\u00A0÷áù\u00A0ôèåòå¬\u00A0óï\u00A0>\u00A0éó\u00A0òåíáéîéîç®",
    },
    {
      input: "64² = 4096",
      flipped: "¶´2\u00A0½\u00A0´°¹¶",
    },
    {
      input: "© FÒÖ BÃR BÅZ 2014",
      flipped: ")\u00A0ÆRV\u00A0ÂCÒ\u00A0ÂEÚ\u00A0²°±´",
    },
    {
      input: 'Öxxö Xööx "Lëïth Säë" - "Ÿ"',
      flipped: "Vøøv\u00A0Øvvø\u00A0¢Ìkoôè\u00A0Ódk¢\u00A0\u00AD\u00A0¢\u001F¢",
    },
    {
      input: "Padded with 0xFFÿÿÿÿÿÿÿÿ",
      flipped:
        "Ðáääåä\u00A0÷éôè\u00A0°øÆÆ\u007F\u007F\u007F\u007F\u007F\u007F\u007F\u007F",
    },
    {
      input: "This string contains NUL\0 (value 0) and a € (value 128)",
      flipped:
        "Ôèéó\u00A0óôòéîç\u00A0ãïîôáéîó\u00A0ÎÕÌ\0\u00A0¨öáìõå\u00A0°©\u00A0áîä\u00A0á\u00A0€\u00A0¨öáìõå\u00A0±²¸©",
    },
  ];

  TEST_DATA.forEach((data) => {
    it(`should interleave "${data.input}" to "${data.flipped}"`, function () {
      const bytes = toBytes(data.input);
      flipMsb(bytes);
      expect(bytes).toStrictEqual(toBytes(data.flipped));
    });
  });
});

describe("swapMultiples()", function () {
  const TEST_DATA = [
    {
      input: "Hello, World!",
      swapped: "Heoll, lroWd!",
    },
    {
      input: "We're ¼ of the way there, so ¾ is remaining.",
      swapped: "Wer'e ¼ fo the way there, so ¾ is remaining.",
    },
    {
      input: "64² = 4096",
      swapped: "64² = 4690",
    },
    {
      input: "© FÒÖ BÃR BÅZ 2014",
      swapped: "© FÒÖ ÃBR BÅZ 2014",
    },
    {
      input: 'Öxxö Xööx "Lëïth Säë" - "Ÿ"',
      swapped: 'Ööxx Xxöö "Lëïth Säë" - "Ÿ"',
    },
    { input: "Padded with 0xFFÿÿÿÿÿÿÿÿ", swapped: "Padded with x0FFÿÿÿÿÿÿÿÿ" },
    {
      input: "This string contains NUL\0 (value 0) and a € (value 128)",
      swapped: "This stirng ocntains NUL\0 (vaule 0) and a € (vaule 128)",
    },
  ];

  TEST_DATA.forEach((data) => {
    it(`should interleave "${data.input}" to "${data.swapped}"`, function () {
      const bytes = toBytes(data.input);
      swapMultiples(bytes, 3);
      expect(bytes).toStrictEqual(toBytes(data.swapped));
    });
  });
});

function toBytes(str: string): Uint8Array {
  const encodedUint16 = windows1252.encode(str);
  const result = new Uint8Array(encodedUint16.length);
  for (let i = 0; i < encodedUint16.length; ++i) {
    result[i] = encodedUint16[i];
  }
  return result;
}
