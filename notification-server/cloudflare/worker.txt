/* Tour d’Asie — Cloudflare. Secrets fournis uniquement par env.
Envois désactivés tant que les deux drapeaux de configuration ne sont pas validés.
Inclut @block65/webcrypto-web-push 2.0.0 :
Copyright 2024 Block65 Pte Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../site-source/notification-server/functions/planner.js
var require_planner = __commonJS({
  "../site-source/notification-server/functions/planner.js"(exports, module) {
    "use strict";
    var ZONES = { cn: "Asia/Shanghai", jp: "Asia/Tokyo", th: "Asia/Bangkok", kh: "Asia/Phnom_Penh", vn: "Asia/Ho_Chi_Minh", la: "Asia/Vientiane", pi: "Asia/Manila" };
    function localClock(now, zone) {
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
      const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
      return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
    }
    function timezoneFor(content, device, now) {
      if (device.followItinerary === false) {
        try {
          localClock(now, device.timezone);
          return device.timezone;
        } catch {
          return "Europe/Paris";
        }
      }
      let date = now.toISOString().slice(0, 10), zone = "Europe/Paris";
      for (let i = 0; i < 2; i++) {
        const stages = (content.STAGES || []).filter((s) => s.start <= date && date < s.end);
        const current = stages.at(-1);
        zone = current ? ZONES[current.id] || "Europe/Paris" : "Europe/Paris";
        date = localClock(now, zone).date;
      }
      return zone;
    }
    function reminderHour(r) {
      if (Number.isInteger(r.notificationHour) && r.notificationHour >= 0 && r.notificationHour <= 23) return r.notificationHour;
      if (/_matin$/.test(r.id)) return 8;
      if (/_budget$/.test(r.id)) return 20;
      if (/_soir$/.test(r.id)) return 21;
      return 9;
    }
    function audience(r) {
      if (r.audience) return r.audience;
      if (r.id === "todo_bag_marie") return "marie";
      if (r.id === "todo_bag_baptiste") return "baptiste";
      return "both";
    }
    function allowedEndpoint(url) {
      try {
        const u = new URL(url);
        return u.protocol === "https:" && !u.username && !u.password && ["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].some((h) => u.hostname === h || u.hostname.endsWith("." + h));
      } catch {
        return false;
      }
    }
    function dueReminders2(content, state, device, now) {
      const zone = timezoneFor(content, device, now), clock = localClock(now, zone);
      if (clock.hour >= 23) return [];
      return (content.REMINDERS || []).filter((r) => r.date === clock.date && !state.reminders?.[r.id] && clock.hour >= reminderHour(r) && (audience(r) === "both" || audience(r) === device.owner)).sort((a, b) => reminderHour(a) - reminderHour(b) || a.id.localeCompare(b.id));
    }
    function notificationPayload2(r, trip) {
      return { title: `${r.icon || "\u{1F514}"} ${r.t}`, body: String(r.s || "").replace(/<[^>]*>/g, " ").slice(0, 1600), tag: `${trip}-${r.id}`, url: `https://tour-dasie.github.io/voyages/?reminder=${encodeURIComponent(r.id)}&trip=${encodeURIComponent(trip)}` };
    }
    module.exports = { localClock, timezoneFor, reminderHour, audience, allowedEndpoint, dueReminders: dueReminders2, notificationPayload: notificationPayload2 };
  }
});

// node_modules/uint8array-extras/index.js
var objectToString = Object.prototype.toString;
var uint8ArrayStringified = "[object Uint8Array]";
var arrayBufferStringified = "[object ArrayBuffer]";
function isType(value, typeConstructor, typeStringified) {
  if (!value) {
    return false;
  }
  if (value.constructor === typeConstructor) {
    return true;
  }
  return objectToString.call(value) === typeStringified;
}
function isUint8Array(value) {
  return isType(value, Uint8Array, uint8ArrayStringified);
}
function isArrayBuffer(value) {
  return isType(value, ArrayBuffer, arrayBufferStringified);
}
function isUint8ArrayOrArrayBuffer(value) {
  return isUint8Array(value) || isArrayBuffer(value);
}
function toUint8ArrayIfArrayBuffer(value) {
  return isArrayBuffer(value) ? new Uint8Array(value) : value;
}
function assertUint8ArrayOrArrayBuffer(value) {
  if (!isUint8ArrayOrArrayBuffer(value)) {
    throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof value}\``);
  }
}
function toUint8Array(value) {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new TypeError(`Unsupported value, got \`${typeof value}\`.`);
}
function concatUint8Arrays(arrays, totalLength) {
  if (arrays.length === 0) {
    return new Uint8Array(0);
  }
  totalLength ??= arrays.reduce((accumulator, currentValue) => accumulator + currentValue.byteLength, 0);
  const returnValue = new Uint8Array(totalLength);
  let offset = 0;
  for (let array of arrays) {
    assertUint8ArrayOrArrayBuffer(array);
    array = toUint8ArrayIfArrayBuffer(array);
    returnValue.set(array, offset);
    offset += array.length;
  }
  return returnValue;
}
var cachedDecoders = {
  utf8: new globalThis.TextDecoder("utf8")
};
function assertString(value) {
  if (typeof value !== "string") {
    throw new TypeError(`Expected \`string\`, got \`${typeof value}\``);
  }
}
var cachedEncoder = new globalThis.TextEncoder();
function stringToUint8Array(string) {
  assertString(string);
  return cachedEncoder.encode(string);
}
function base64ToBase64Url(base64) {
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function base64UrlToBase64(base64url) {
  const base64 = base64url.replaceAll("-", "+").replaceAll("_", "/");
  const padding = (4 - base64.length % 4) % 4;
  return base64 + "=".repeat(padding);
}
var MAX_BLOCK_SIZE = 65535;
function uint8ArrayToBase64(array, { urlSafe = false } = {}) {
  assertUint8ArrayOrArrayBuffer(array);
  array = toUint8ArrayIfArrayBuffer(array);
  let base64 = "";
  for (let index = 0; index < array.length; index += MAX_BLOCK_SIZE) {
    const chunk = array.subarray(index, index + MAX_BLOCK_SIZE);
    base64 += globalThis.btoa(String.fromCodePoint.apply(void 0, chunk));
  }
  return urlSafe ? base64ToBase64Url(base64) : base64;
}
function base64ToUint8Array(base64String) {
  assertString(base64String);
  return Uint8Array.from(globalThis.atob(base64UrlToBase64(base64String)), (x) => x.codePointAt(0));
}
var byteToHexLookupTable = Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, "0"));

// node_modules/@block65/webcrypto-web-push/dist/lib/utils.js
function encodeRecordSize(size) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, size);
  return bytes;
}
function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// node_modules/@block65/webcrypto-web-push/dist/lib/client-keys.js
async function deriveClientKeys(sub) {
  const bytes = base64ToUint8Array(sub.keys.p256dh);
  const authSecretBytes = base64ToUint8Array(sub.keys.auth);
  invariant(bytes.byteLength === 65 && bytes[0] === 4, "Subscription p256dh is not an uncompressed P-256 point");
  invariant(authSecretBytes.byteLength === 16, "Subscription auth secret is not 16 bytes");
  return {
    publicKeyBytes: bytes,
    publicKey: await crypto.subtle.importKey("raw", bytes, {
      name: "ECDH",
      namedCurve: "P-256"
    }, false, []),
    authSecretBytes
  };
}

// node_modules/@block65/webcrypto-web-push/dist/lib/hkdf.js
function createHMAC(data) {
  const keyPromise = crypto.subtle.importKey("raw", data, {
    name: "HMAC",
    hash: "SHA-256"
  }, false, ["sign"]);
  return {
    hash: async (input) => {
      const k = await keyPromise;
      return crypto.subtle.sign("HMAC", k, input);
    }
  };
}
async function hkdf(salt, ikm) {
  const prkhPromise = createHMAC(salt).hash(ikm).then((prk) => createHMAC(prk));
  return {
    extract: async (info, len) => {
      const prkh = await prkhPromise;
      const blocks = await Array.from({ length: Math.ceil(len / 32) }, (_, i) => i).reduce(async (acc, i) => {
        const previous = await acc;
        const hash = await prkh.hash(new Uint8Array([...previous.at(-1) ?? [], ...info, i + 1]));
        return [...previous, new Uint8Array(hash)];
      }, Promise.resolve([]));
      return concatUint8Arrays(blocks).slice(0, len);
    }
  };
}

// node_modules/@block65/webcrypto-web-push/dist/lib/info.js
function createKeyInfo(clientPublic, serverPublic) {
  return new Uint8Array([
    ...stringToUint8Array("WebPush: info\0"),
    ...clientPublic,
    ...serverPublic
  ]);
}
function createInfo(type) {
  return stringToUint8Array(`Content-Encoding: ${type}\0`);
}

// node_modules/@block65/webcrypto-web-push/dist/lib/local-keys.js
async function generateLocalKeys() {
  const keyPair = await crypto.subtle.generateKey({
    name: "ECDH",
    namedCurve: "P-256"
  }, false, ["deriveBits"]);
  return {
    privateKey: keyPair.privateKey,
    publicKeyBytes: new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey))
  };
}

// node_modules/@block65/webcrypto-web-push/dist/lib/salt.js
async function getSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

// node_modules/@block65/webcrypto-web-push/dist/lib/encrypt.js
var recordSize = 4096;
var headerSize = 21 + 65;
var maxPlaintextSize = recordSize - headerSize - 17;
async function encryptNotification(subscription, plaintext, options = {}) {
  invariant(plaintext.byteLength <= maxPlaintextSize, `Payload is ${plaintext.byteLength} bytes, the maximum is ${maxPlaintextSize}`);
  const clientKeys = await deriveClientKeys(subscription);
  const salt = await getSalt();
  const localKeys = await generateLocalKeys();
  const sharedSecret = await crypto.subtle.deriveBits({
    name: "ECDH",
    public: clientKeys.publicKey
  }, localKeys.privateKey, 256);
  const keyInfo = createKeyInfo(clientKeys.publicKeyBytes, localKeys.publicKeyBytes);
  const cekInfo = createInfo("aes128gcm");
  const nonceInfo = createInfo("nonce");
  const ikmHkdf = await hkdf(clientKeys.authSecretBytes, sharedSecret);
  const ikm = await ikmHkdf.extract(keyInfo, 32);
  const messageHkdf = await hkdf(salt, ikm);
  const cekBytes = await messageHkdf.extract(cekInfo, 16);
  const nonceBytes = await messageHkdf.extract(nonceInfo, 12);
  const cekCryptoKey = await crypto.subtle.importKey("raw", cekBytes, {
    name: "AES-GCM",
    length: 128
  }, false, ["encrypt"]);
  const padTo = options.pad ?? true ? maxPlaintextSize : plaintext.byteLength;
  const padded = new Uint8Array(padTo + 1);
  padded.set(plaintext);
  padded[plaintext.byteLength] = 2;
  const encrypted = await crypto.subtle.encrypt({
    name: "AES-GCM",
    iv: nonceBytes
  }, cekCryptoKey, padded);
  return new Uint8Array([
    ...salt,
    ...encodeRecordSize(recordSize),
    localKeys.publicKeyBytes.byteLength,
    ...localKeys.publicKeyBytes,
    ...new Uint8Array(encrypted)
  ]);
}

// node_modules/@block65/webcrypto-web-push/dist/lib/base64.js
function encodeBase64Url(value) {
  return uint8ArrayToBase64(toUint8Array(value), { urlSafe: true });
}
function objectToBase64Url(obj) {
  return encodeBase64Url(stringToUint8Array(JSON.stringify(obj)));
}

// node_modules/@block65/webcrypto-web-push/dist/lib/jwt.js
async function sign(payload, key) {
  const headerStr = objectToBase64Url({
    typ: "JWT",
    alg: "ES256"
  });
  const payloadStr = objectToBase64Url({
    iat: Math.floor(Date.now() / 1e3),
    ...payload
  });
  const dataStr = `${headerStr}.${payloadStr}`;
  const signature = await crypto.subtle.sign({
    name: "ECDSA",
    hash: "SHA-256"
  }, key, stringToUint8Array(dataStr));
  return `${dataStr}.${encodeBase64Url(signature)}`;
}

// node_modules/@block65/webcrypto-web-push/dist/lib/vapid.js
async function vapidHeaders(subscription, vapid) {
  invariant(vapid.subject, "Vapid subject is empty");
  invariant(vapid.privateKey, "Vapid private key is empty");
  invariant(vapid.publicKey, "Vapid public key is empty");
  const endpoint = new URL(subscription.endpoint);
  invariant(endpoint.protocol === "https:", `Subscription endpoint is not https: ${endpoint.protocol}`);
  const vapidPublicKeyBytes = base64ToUint8Array(vapid.publicKey);
  const publicKey = await crypto.subtle.importKey("jwk", {
    kty: "EC",
    crv: "P-256",
    x: encodeBase64Url(vapidPublicKeyBytes.slice(1, 33)),
    y: encodeBase64Url(vapidPublicKeyBytes.slice(33, 65)),
    d: vapid.privateKey
  }, {
    name: "ECDSA",
    namedCurve: "P-256"
  }, false, ["sign"]);
  const jwt = await sign({
    aud: endpoint.origin,
    exp: Math.floor(Date.now() / 1e3) + 12 * 60 * 60,
    sub: vapid.subject
  }, publicKey);
  return {
    headers: {
      authorization: `vapid t=${jwt}, k=${vapid.publicKey}`
    }
  };
}

// node_modules/@block65/webcrypto-web-push/dist/lib/payload.js
async function buildPushPayload(message, subscription, vapid) {
  const { headers } = await vapidHeaders(subscription, vapid);
  const body = await encryptNotification(subscription, stringToUint8Array(
    // if its a primitive, convert to string, otherwise stringify
    typeof message.data === "string" || typeof message.data === "number" ? message.data.toString() : JSON.stringify(message.data)
  ));
  return {
    headers: {
      ...headers,
      ttl: (message.options?.ttl || 60).toString(),
      ...message.options?.urgency && {
        urgency: message.options.urgency
      },
      ...message.options?.topic && {
        topic: message.options.topic
      },
      "content-encoding": "aes128gcm",
      "content-length": body.byteLength.toString(),
      "content-type": "application/octet-stream"
    },
    method: "post",
    body
  };
}

// worker.mjs
var import_planner = __toESM(require_planner(), 1);
var { dueReminders, notificationPayload } = import_planner.default;
var DATABASE = "https://tour-dasie-default-rtdb.europe-west1.firebasedatabase.app";
var API_KEY = "AIzaSyAHQvnPU9LUMW2R6AAf1RHr2FuAjAhYRLM";
var TRIP = "asie";
var PATH = /^[A-Za-z0-9_-]+$/;
var MAX_BYTES = 4 * 1024 * 1024;
var MAX_SENDS = 4;
var pendingRun = null;
function prerequisites(env) {
  const missing = [];
  for (const key of ["FIREBASE_EMAIL", "FIREBASE_PASSWORD", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"]) if (typeof env[key] !== "string" || !env[key]) missing.push(key);
  if (!env.REMINDER_STORE?.get || !env.REMINDER_STORE?.put) missing.push("REMINDER_STORE");
  return missing;
}
function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'" } });
}
async function publicStatus(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return jsonResponse({ message: "M\xE9thode non autoris\xE9e" }, 405);
  const response = jsonResponse({ service: "Tour d\u2019Asie \u2014 rappels", programme: "install\xE9", message: "Le programme est install\xE9. Les envois n\xE9cessitent la configuration priv\xE9e, un d\xE9clencheur et la validation de s\xE9curit\xE9. Cette page ne d\xE9clenche aucun envoi." });
  return request.method === "HEAD" ? new Response(null, { status: response.status, headers: response.headers }) : response;
}
async function limitedJSON(response) {
  if (!response.ok) throw Error("REMOTE_REQUEST_FAILED");
  if (Number(response.headers.get("content-length")) > MAX_BYTES) throw Error("DATA_TOO_LARGE");
  const reader = response.body.getReader();
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) throw Error("DATA_TOO_LARGE");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {
    });
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function timedFetch(fetcher, url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15e3);
  try {
    return await fetcher(url, { ...options, redirect: "error", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
async function firebaseSession(env, fetcher = fetch) {
  const response = await timedFetch(fetcher, `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: env.FIREBASE_EMAIL, password: env.FIREBASE_PASSWORD, returnSecureToken: true }) });
  const data = await limitedJSON(response);
  if (typeof data.idToken !== "string" || !data.idToken) throw Error("AUTH_FAILED");
  async function request(path, options = {}) {
    if (!path.split("/").every((part) => PATH.test(part))) throw Error("INVALID_DATABASE_PATH");
    const url = new URL(`${DATABASE}/${path}.json`);
    url.searchParams.set("auth", data.idToken);
    return timedFetch(fetcher, url.href, options);
  }
  return {
    read: async (path) => limitedJSON(await request(path)),
    write: async (path, value) => {
      const response2 = await request(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      if (!response2.ok) throw Error("DATABASE_WRITE_DENIED");
    },
    claim: async (path, now) => {
      const response2 = await request(path, { headers: { "X-Firebase-ETag": "true" } });
      const etag = response2.headers.get("etag"), old = await limitedJSON(response2);
      if (!etag) throw Error("MISSING_ETAG");
      if (old?.sentAt || old?.cancelledAt || old?.leaseAt && now - old.leaseAt < 20 * 6e4) return false;
      const put = await request(path, { method: "PUT", headers: { "Content-Type": "application/json", "If-Match": etag }, body: JSON.stringify({ leaseAt: now }) });
      if (put.status === 412) return false;
      if (!put.ok) throw Error("DATABASE_WRITE_DENIED");
      return true;
    }
  };
}
function subscriptionAllowed(device, publicKey) {
  if (!device || device.disabled || device.vapidPublicKey !== publicKey || !["marie", "baptiste"].includes(device.owner)) return false;
  if (!Array.isArray(device.trips) || !device.trips.includes(TRIP)) return false;
  try {
    const u = new URL(device.endpoint);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return false;
    if (!["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].some((h) => u.hostname === h || u.hostname.endsWith("." + h))) return false;
    return /^[A-Za-z0-9_-]{87}$/.test(device.keys?.p256dh || "") && /^[A-Za-z0-9_-]{22}$/.test(device.keys?.auth || "");
  } catch {
    return false;
  }
}
function compactContent(content) {
  if (!content || !Array.isArray(content.STAGES) || !Array.isArray(content.REMINDERS)) throw Error("INVALID_CONTENT");
  return { STAGES: content.STAGES.map((s) => ({ id: s.id, start: s.start, end: s.end })), REMINDERS: content.REMINDERS.filter((r) => PATH.test(r.id) && /^\d{4}-\d{2}-\d{2}$/.test(r.date)).map((r) => ({ id: r.id, date: r.date, t: String(r.t || "Rappel").slice(0, 100), s: String(r.s || "").slice(0, 450), icon: String(r.icon || "\u{1F514}").slice(0, 8), audience: r.audience, notificationHour: r.notificationHour })) };
}
async function contentCache(env, db, now) {
  const key = `content-${TRIP}`, cached = await env.REMINDER_STORE.get(key, "json");
  if (cached?.at && now - cached.at < 36e5) return cached.value;
  const raw = await db.read(`voyages/${TRIP}/content`);
  const value = compactContent(typeof raw === "string" ? JSON.parse(raw) : raw);
  await env.REMINDER_STORE.put(key, JSON.stringify({ at: now, value }), { expirationTtl: 7200 });
  return value;
}
function stateValue(raw) {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!value || typeof value !== "object" || !value.reminders || typeof value.reminders !== "object") throw Error("INVALID_STATE");
  return { reminders: value.reminders };
}
async function dispatch(env, now = /* @__PURE__ */ new Date(), deps = {}) {
  if (env.NOTIFICATIONS_ENABLED !== "true" || env.SECURITY_REVIEW_APPROVED !== "true") return { status: "disabled", accepted: 0 };
  if (prerequisites(env).length) return { status: "configuration_incomplete", accepted: 0 };
  const db = deps.db || await firebaseSession(env, deps.fetcher || fetch);
  const settings = await db.read(`voyages/${TRIP}/notificationSettings`);
  if (settings?.enabled !== true) return { status: "disabled", accepted: 0 };
  const content = await contentCache(env, db, now.getTime());
  const devices = await db.read("push");
  const candidates = Object.entries(devices || {}).filter(([key, d]) => PATH.test(key) && subscriptionAllowed(d, env.VAPID_PUBLIC_KEY)).slice(0, 5);
  if (!candidates.length) return { status: "devices_not_registered", accepted: 0 };
  let accepted = 0, failed = 0, state;
  const send = deps.send || (async (device, payload) => {
    const request = await buildPushPayload({ data: JSON.stringify(payload), options: { ttl: 21600, urgency: "normal" } }, device, { subject: "https://tour-dasie.github.io/voyages/", publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY });
    return timedFetch(deps.fetcher || fetch, device.endpoint, request);
  });
  for (const [key, device] of candidates) {
    const logs = await db.read(`notificationDelivery/${TRIP}/${key}`) || {};
    const due = dueReminders(content, { reminders: {} }, device, now).filter((r) => !logs[r.id]?.sentAt && !logs[r.id]?.cancelledAt);
    const testAt = device.testRequestedAt;
    if (testAt && testAt > (device.testSentAt || 0) && now.getTime() - testAt < 36e5 && Number.isSafeInteger(testAt)) due.unshift({ id: `test_${testAt}`, test: true, t: "Test serveur \u2014 Tour d\u2019Asie", s: "Cette notification vient du service Cloudflare. Elle peut arriver carnet ferm\xE9." });
    for (const reminder of due) {
      if (accepted + failed >= MAX_SENDS) break;
      if (!reminder.test) {
        if (!state) state = stateValue(await db.read(`voyages/${TRIP}/data/blob`));
        if (state.reminders[reminder.id]) continue;
      }
      const logPath = `notificationDelivery/${TRIP}/${key}/${reminder.id}`;
      if (!await db.claim(logPath, now.getTime())) continue;
      try {
        const response = await send(device, notificationPayload(reminder, TRIP));
        if (response.status === 201 || response.status === 202) {
          await db.write(logPath, { sentAt: now.getTime(), leaseAt: 0 });
          accepted++;
        } else {
          await db.write(logPath, { leaseAt: now.getTime(), lastStatus: response.status });
          failed++;
          if (response.status === 404 || response.status === 410) break;
        }
      } catch {
        failed++;
      }
    }
  }
  await db.write(`voyages/${TRIP}/notificationService`, { status: "active", lastRunAt: now.getTime(), accepted, failed, mode: "individual", provider: "cloudflare", cadenceMinutes: 15 });
  return { status: "ran", accepted, failed };
}
var worker_default = {
  fetch: publicStatus,
  async scheduled(event, env, ctx) {
    if (pendingRun) return;
    pendingRun = dispatch(env, new Date(event.scheduledTime)).catch(() => ({ status: "failed", accepted: 0 }));
    try {
      await pendingRun;
    } finally {
      pendingRun = null;
    }
  }
};

// deploy-entry.mjs
var deploy_entry_default = worker_default;
export {
  deploy_entry_default as default
};
