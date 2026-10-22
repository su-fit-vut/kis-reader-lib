import { PacketError } from "./errors.js";
import { INVALID_FORMAT, EMPTY_RESPONSE } from "./errorCodes.js";
export var ProtokolA2C;
(function (ProtokolA2C) {
    ProtokolA2C[ProtokolA2C["Ping"] = 0] = "Ping";
    ProtokolA2C[ProtokolA2C["AutoReadBegin"] = 1] = "AutoReadBegin";
    ProtokolA2C[ProtokolA2C["SingleRead"] = 2] = "SingleRead";
    ProtokolA2C[ProtokolA2C["Idle"] = 3] = "Idle";
    ProtokolA2C[ProtokolA2C["SingleAuthenticateKey"] = 5] = "SingleAuthenticateKey";
    ProtokolA2C[ProtokolA2C["SingleAuthenticateId"] = 4] = "SingleAuthenticateId";
    ProtokolA2C[ProtokolA2C["PrintTextDual"] = 6] = "PrintTextDual";
    ProtokolA2C[ProtokolA2C["SendSPAYd"] = 7] = "SendSPAYd";
})(ProtokolA2C || (ProtokolA2C = {}));
export var ProtokolC2A;
(function (ProtokolC2A) {
    ProtokolC2A[ProtokolC2A["Pong"] = 8] = "Pong";
    ProtokolC2A[ProtokolC2A["AutoId"] = 9] = "AutoId";
    ProtokolC2A[ProtokolC2A["SingleId"] = 10] = "SingleId";
    ProtokolC2A[ProtokolC2A["SingleIdSendKey"] = 11] = "SingleIdSendKey";
    ProtokolC2A[ProtokolC2A["VerificationCode"] = 12] = "VerificationCode";
})(ProtokolC2A || (ProtokolC2A = {}));
export const createPacket = (type, data) => {
    const packet = new Uint8Array(35);
    packet[0] = type;
    packet[1] = 0x6E;
    packet[34] = 0xE6;
    if (data) {
        if (!(data instanceof ArrayBuffer))
            throw new Error("data must be ArrayBuffer");
        if (data.byteLength > 32)
            throw new Error("data must be <=32 bytes");
        packet.set(new Uint8Array(data), 2);
    }
    return packet;
};
const GWALLET_PREFIX = [0x67, 0x77, 0x61, 0x6C, 0x6C, 0x65, 0x74, 0x2D];
const APAY_PREFIX = [0x61, 0x70, 0x61, 0x79, 0x2D];
const hasPrefix = (data, prefix) => {
    if (data.length <= prefix.length)
        return false;
    for (let i = 0; i < prefix.length; i++) {
        if (data[i] !== prefix[i])
            return false;
    }
    return true;
};
export const isMobileCardPacket = (data) => {
    return hasPrefix(data, GWALLET_PREFIX) || hasPrefix(data, APAY_PREFIX);
};
export const checkPacket = (packet) => {
    if (isMobileCardPacket(packet))
        return;
    if (packet[1] !== 0x6E || packet[34] !== 0xE6)
        throw new PacketError('Invalid packet header / footer', INVALID_FORMAT);
    if (packet.length !== 35)
        throw new PacketError('Invalid packet size', INVALID_FORMAT);
    packet.forEach((val) => {
        if (val < 0)
            throw new PacketError('Invalid packet data', INVALID_FORMAT);
    });
};
export const parsePacket = (packet) => {
    checkPacket(packet);
    if (isMobileCardPacket(packet)) {
        return { type: ProtokolC2A.SingleId, data: packet.slice() };
    }
    let typeNum = packet[0];
    let data = packet.slice(2, 2 + 32);
    return { type: typeNum, data };
};
export const decodeRfidData = (data) => {
    let cardIdBase64;
    let signatureBase64;
    if (isMobileCardPacket(data)) {
        let binary = '';
        for (let i = 0; i < data.length && data[i] !== 0; i++) {
            binary += String.fromCharCode(data[i]);
        }
        return { cardIdBase64: binary, signatureBase64: binary };
    }
    {
        let binary = '';
        let isNonZero = false;
        let idLen = data[0];
        if (idLen == 0x20 || idLen == 0x25) {
            binary = idLen == 0x20 ? 'gwallet-' : 'apay-';
            let tokenBytes = 4;
            for (let i = 5; i <= 16 && i < data.length; i++) {
                if (data[i] !== 0) {
                    tokenBytes = 16;
                    break;
                }
            }
            for (let i = 1; i < 1 + tokenBytes && i < data.length; i++) {
                if (!isNonZero && data[i] > 0)
                    isNonZero = true;
                binary += data[i].toString(16).padStart(2, '0').toUpperCase();
            }
            return { cardIdBase64: binary, signatureBase64: binary };
        }
        for (let i = 1; i < (1 + idLen); i++) {
            if (!isNonZero && data[i] > 0)
                isNonZero = true;
            binary += String.fromCharCode(data[i]);
        }
        if (!isNonZero) {
            throw new PacketError('Card ID is null', EMPTY_RESPONSE);
        }
        cardIdBase64 = window.btoa(binary);
    }
    {
        let binary = '';
        let isNonZero = false;
        for (let i = 16; i <= 31; i++) {
            if (!isNonZero && data[i] > 0)
                isNonZero = true;
            binary += String.fromCharCode(data[i]);
        }
        if (!isNonZero) {
            throw new PacketError('Card signature is null', EMPTY_RESPONSE);
        }
        signatureBase64 = window.btoa(binary);
    }
    return { cardIdBase64, signatureBase64 };
};
export const createPingPacket = (numCode) => {
    const uint32 = new Uint32Array(1);
    uint32[0] = numCode;
    let msg = createPacket(ProtokolA2C.Ping, uint32.buffer);
    return msg;
};
export const decodePongData = (data) => {
    let uint32;
    if (data.byteOffset % Uint32Array.BYTES_PER_ELEMENT == 0)
        uint32 = new Uint32Array(data.buffer, data.byteOffset, Uint32Array.BYTES_PER_ELEMENT);
    else
        uint32 = new Uint32Array(data.slice(data.byteOffset, data.byteOffset + Uint32Array.BYTES_PER_ELEMENT));
    const numCode = uint32[0];
    return numCode;
};
export const createDisplayPacket = (lineOne, lineTwo) => {
    const msg = createPacket(ProtokolA2C.PrintTextDual);
    for (let i = 0; i < 16 && lineOne.length; i++)
        msg[2 + i] = lineOne.charCodeAt(i);
    for (let i = 0; i < 16 && lineTwo.length; i++)
        msg[2 + 16 + i] = lineTwo.charCodeAt(i);
    return msg;
};
export const createSpaydPacket = (spayd) => {
    const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    const rawData = encoder ? encoder.encode(spayd) : Uint8Array.from(Array.from(spayd).map(c => c.charCodeAt(0)));
    const packet = new Uint8Array(1 + rawData.length);
    packet[0] = ProtokolA2C.SendSPAYd;
    packet.set(rawData, 1);
    return packet;
};
export const createSendSPAYdPacket = createSpaydPacket;
//# sourceMappingURL=packet.js.map