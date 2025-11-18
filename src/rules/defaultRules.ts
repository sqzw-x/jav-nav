import type { SiteRule } from "./types";

const baseRules: SiteRule[] = [
  {
    id: "missav",
    name: "MissAV",
    keywords: ["missav"],
    enabled: true,
    entryPoints: [
      {
        id: "search",
        displayName: "MissAV",
        requiredIdentifierType: "fanhao",
        urlTemplate: "https://missav.ws/cn/search/{fanhao}",
        color: "#fe628e",
      },
    ],
    matchers: [
      {
        id: "missav",
        matchScope: "hostname",
        pattern: "missav",
      },
    ],
    detailPageGuards: [
      {
        id: "movie-title",
        type: "selector",
        rule: "h1.text-base",
      },
    ],
    identifierExtractors: [
      {
        id: "title-prefix",
        method: "selector",
        priority: 1,
        identifierType: "fanhao",
        pattern: "(\\S+)\\s.*",
        selector: "h1.text-base",
      },
    ],
    uiPlacement: {
      anchor: "h1.text-base",
      position: "after",
    },
  },
  {
    id: "javdb",
    name: "JavDB",
    keywords: ["javdb"],
    enabled: true,
    entryPoints: [
      {
        id: "javdb-search-fanhao",
        requiredIdentifierType: "fanhao",
        urlTemplate: "https://javdb.com/search?q={fanhao:upper}",
        displayName: "JavDB",
      },
    ],
    matchers: [
      {
        id: "javdb-default",
        pattern: "javdb\\d*\\.com",
        matchScope: "hostname",
      },
    ],
    detailPageGuards: [
      {
        id: "javdb-detail",
        type: "url-regex",
        rule: "/v/",
      },
    ],
    identifierExtractors: [
      {
        id: "javdb-fanhao",
        method: "selector",
        selector: "h2 strong",
        identifierType: "fanhao",
      },
    ],
    uiPlacement: {
      anchor: ".video-meta-panel",
      position: "after",
    },
  },
  {
    id: "fanza",
    name: "Fanza",
    keywords: ["dmm.co.jp"],
    enabled: true,
    entryPoints: [
      {
        id: "search",
        displayName: "Fanza",
        requiredIdentifierType: "fanhao",
        urlTemplate: "https://www.dmm.co.jp/search/=/searchstr={id}",
        pattern: "-",
        replaceWith: "00",
        color: "#ee2737",
      },
    ],
    matchers: [],
    detailPageGuards: [],
    identifierExtractors: [],
    uiPlacement: {
      anchor: "body",
      position: "append",
    },
  },
  {
    id: "avbase",
    name: "AVBase",
    keywords: ["avbase"],
    enabled: true,
    entryPoints: [
      {
        id: "search",
        displayName: "AVBase",
        urlTemplate: "https://www.avbase.net/works?q={id}",
        requiredIdentifierType: "fanhao",
        color: "#3b71b0",
      },
    ],
    matchers: [],
    detailPageGuards: [],
    identifierExtractors: [],
    uiPlacement: {
      anchor: "body",
      position: "append",
    },
  },
  {
    id: "subtitle-cat",
    name: "subtitle-cat",
    keywords: ["subtitlecat.com"],
    enabled: true,
    entryPoints: [
      {
        id: "search",
        displayName: "字幕猫",
        requiredIdentifierType: "fanhao",
        urlTemplate: "https://www.subtitlecat.com/index.php?search={id}",
        color: "#fdba29",
      },
    ],
    matchers: [],
    detailPageGuards: [],
    identifierExtractors: [],
    uiPlacement: {
      anchor: "body",
      position: "append",
    },
  },
  {
    id: "javbus",
    name: "JavBus",
    keywords: ["javbus.com", "buscdn.cyou"],
    enabled: true,
    entryPoints: [
      {
        id: "detail",
        displayName: "JavBus",
        requiredIdentifierType: "fanhao",
        urlTemplate: "https://www.javbus.com/{id}",
        color: "#cc0000",
      },
    ],
    matchers: [
      {
        id: "any",
        matchScope: "hostname",
        pattern: ".*",
      },
    ],
    detailPageGuards: [
      {
        id: "image",
        type: "selector",
        rule: "div.screencap",
      },
    ],
    identifierExtractors: [
      {
        id: "url-suffix",
        method: "url-regex",
        identifierType: "fanhao",
        pattern: ".+/(.+)",
      },
    ],
    uiPlacement: {
      anchor: "div.row.movie",
      position: "after",
    },
  },
  {
    id: "javlibrary",
    name: "javlibrary",
    keywords: ["z93j.com", "javlibrary.com"],
    enabled: true,
    entryPoints: [
      {
        id: "search",
        displayName: "Library",
        color: "#f908bb",
        urlTemplate: "https://www.javlibrary.com/cn/vl_searchbyid.php?keyword={id}",
        requiredIdentifierType: "fanhao",
      },
    ],
    matchers: [
      {
        id: "detail",
        matchScope: "query",
        pattern: "v=",
      },
    ],
    detailPageGuards: [
      {
        id: "detail",
        type: "selector",
        rule: "#video_info",
      },
    ],
    identifierExtractors: [
      {
        id: "info",
        method: "selector",
        identifierType: "fanhao",
        selector: "#video_id td.text",
      },
    ],
    uiPlacement: {
      anchor: "#video_favorite_edit",
      position: "after",
    },
  },
];

export const defaultSiteRules = baseRules;

export const createDefaultSiteRules = (): SiteRule[] => JSON.parse(JSON.stringify(baseRules));
