import csImg from './images/cs.jpg';
import jdImg from './images/jd.jpg';
import jzImg from './images/jz.jpg';
import jzDnsImg from './images/jzDNS.jpg';

export type OverlayType = 'img' | 'string';

export interface OverlayAttr {
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  height: number;
  left: number;
  top: number;
  type: OverlayType;
  value: string;
  width: number;
}

export interface PdfTemplate {
  attr: Record<string, OverlayAttr>;
  img: string;
  key: string;
  title: string;
}

const FONT_BODY = 'SimSun, STSong, "Songti SC", serif';
const FONT_NUM = '"Times New Roman", SimSun, serif';
const COLOR_TEXT = '#000000';

/** 宽、高、上、左 */
const box = (
  width: number,
  height: number,
  top: number,
  left: number,
  extra: Partial<OverlayAttr> = {},
): OverlayAttr => ({
  type: 'string',
  value: '',
  width,
  height,
  top,
  left,
  fontFamily: FONT_BODY,
  fontSize: 50,
  color: COLOR_TEXT,
  ...extra,
});

const imgBox = (
  width: number,
  height: number,
  top: number,
  left: number,
): OverlayAttr => ({
  type: 'img',
  value: '',
  width,
  height,
  top,
  left,
});

const jzAttr = (): Record<string, OverlayAttr> => ({
  证书编号: box(532, 100, 876, 1163, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  委托方: box(1220, 120, 1094, 816, { fontSize: 50 }),
  地址: box(1220, 120, 1240, 816, { fontSize: 50 }),
  样品名称: box(1220, 120, 1386, 816, { fontSize: 50 }),
  制造厂商: box(1220, 120, 1534, 816, { fontSize: 50 }),
  型号规格: box(1220, 120, 1680, 816, { fontSize: 50 }),
  器具编号: box(1220, 120, 1828, 816, { fontSize: 50 }),
  批准: imgBox(595, 170, 1972, 1440),
  核验: imgBox(595, 170, 2154, 1440),
  校准: imgBox(595, 170, 2338, 1440),
  接收日期年: box(180, 88, 2561, 673, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  接收日期月: box(130, 88, 2561, 1008, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  接收日期日: box(130, 88, 2561, 1321, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  校准日期年: box(180, 88, 2676, 673, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  校准日期月: box(130, 88, 2676, 1008, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  校准日期日: box(130, 88, 2676, 1321, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  签发日期年: box(180, 88, 2794, 673, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  签发日期月: box(130, 88, 2794, 1008, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  签发日期日: box(130, 88, 2794, 1321, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  二维码: imgBox(196, 196, 2680, 1919),
  当前页: box(90, 44, 3261, 1918, {
    fontFamily: FONT_NUM,
    fontSize: 40,
  }),
  总页: box(90, 44, 3261, 2092, {
    fontFamily: FONT_NUM,
    fontSize: 40,
  }),
});

const jzPlainAttr = (): Record<string, OverlayAttr> => ({
  证书编号: box(532, 100, 899, 1163, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  委托方: box(1220, 120, 1135, 816, { fontSize: 50 }),
  地址: box(1220, 120, 1280, 816, { fontSize: 50 }),
  样品名称: box(1220, 120, 1428, 816, { fontSize: 50 }),
  制造厂商: box(1220, 120, 1576, 816, { fontSize: 50 }),
  型号规格: box(1220, 120, 1722, 816, { fontSize: 50 }),
  器具编号: box(1220, 120, 1870, 816, { fontSize: 50 }),
  批准: imgBox(595, 170, 2012, 1440),
  核验: imgBox(595, 170, 2192, 1440),
  校准: imgBox(595, 170, 2375, 1440),
  接收日期年: box(180, 88, 2602, 673, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  接收日期月: box(130, 88, 2602, 1008, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  接收日期日: box(130, 88, 2602, 1321, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  校准日期年: box(180, 88, 2720, 673, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  校准日期月: box(130, 88, 2720, 1008, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  校准日期日: box(130, 88, 2720, 1321, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  签发日期年: box(180, 88, 2840, 673, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  签发日期月: box(130, 88, 2840, 1008, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  签发日期日: box(130, 88, 2840, 1321, {
    fontFamily: FONT_NUM,
    fontSize: 50,
  }),
  二维码: imgBox(196, 196, 2726, 1919),
  当前页: box(90, 44, 3225, 1921, {
    fontFamily: FONT_NUM,
    fontSize: 40,
  }),
  总页: box(90, 44, 3225, 2103, {
    fontFamily: FONT_NUM,
    fontSize: 40,
  }),
});

export function createPdfTemplates(): PdfTemplate[] {
  return [
    {
      key: 'cs',
      title: '测试报告',
      img: csImg,
      attr: {
        报告编号: box(532, 88, 928, 1163, {
          fontFamily: FONT_NUM,
          fontSize: 48,
        }),
        委托方: box(1220, 120, 1200, 816, { fontSize: 50 }),
        样品名称: box(1220, 120, 1356, 816, { fontSize: 50 }),
        制造厂商: box(1220, 120, 1508, 816, { fontSize: 50 }),
        型号规格: box(1220, 120, 1668, 816, { fontSize: 50 }),
        器具编号: box(1220, 120, 1824, 816, { fontSize: 50 }),
        批准: imgBox(595, 170, 2033, 1440),
        核验: imgBox(595, 170, 2212, 1440),
        测试: imgBox(595, 170, 2391, 1440),
        测试日期年: box(180, 88, 2725, 839, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        测试日期月: box(130, 88, 2725, 1174, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        测试日期日: box(130, 88, 2725, 1488, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        二维码: imgBox(196, 196, 2720, 1940),
        当前页: box(90, 44, 3228, 1922, {
          fontFamily: FONT_NUM,
          fontSize: 40,
        }),
        总页: box(90, 44, 3228, 2103, {
          fontFamily: FONT_NUM,
          fontSize: 40,
        }),
      },
    },
    {
      key: 'jd',
      title: '检定证书',
      img: jdImg,
      attr: {
        证书编号: box(532, 112, 852, 1163, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        送检单位: box(1220, 110, 1083, 816, { fontSize: 50 }),
        计量器具名称: box(1220, 110, 1228, 816, { fontSize: 50 }),
        型号规格: box(1220, 110, 1376, 816, { fontSize: 50 }),
        器具编号: box(1220, 110, 1522, 816, { fontSize: 50 }),
        制造厂商: box(1220, 110, 1669, 816, { fontSize: 50 }),
        检定依据: box(1220, 110, 1804, 816, { fontSize: 50 }),
        检定结论: box(1220, 110, 1964, 816, { fontSize: 50 }),
        批准: imgBox(595, 170, 2123, 1440),
        核验: imgBox(595, 170, 2310, 1440),
        检定: imgBox(595, 170, 2490, 1440),
        检定日期年: box(180, 88, 2706, 780, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        检定日期月: box(130, 88, 2706, 1136, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        检定日期日: box(130, 88, 2706, 1448, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        有效期至年: box(180, 88, 2808, 780, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        有效期至月: box(130, 88, 2808, 1136, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        有效期至日: box(130, 88, 2808, 1448, {
          fontFamily: FONT_NUM,
          fontSize: 50,
        }),
        二维码: imgBox(196, 196, 2706, 1920),
        当前页: box(90, 44, 3228, 1921, {
          fontFamily: FONT_NUM,
          fontSize: 40,
        }),
        总页: box(90, 44, 3228, 2103, {
          fontFamily: FONT_NUM,
          fontSize: 40,
        }),
      },
    },
    {
      key: 'jzDNS',
      title: '校准证书(CNAS)',
      img: jzDnsImg,
      attr: jzAttr(),
    },
    {
      key: 'jz',
      title: '校准证书',
      img: jzImg,
      attr: jzPlainAttr(),
    },
  ];
}
