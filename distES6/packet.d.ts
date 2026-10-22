export declare enum ProtokolA2C {
    Ping = 0,
    AutoReadBegin = 1,
    SingleRead = 2,
    Idle = 3,
    SingleAuthenticateKey = 5,
    SingleAuthenticateId = 4,
    PrintTextDual = 6,
    SendSPAYd = 7
}
export declare enum ProtokolC2A {
    Pong = 8,
    AutoId = 9,
    SingleId = 10,
    SingleIdSendKey = 11,
    VerificationCode = 12
}
export declare const createPacket: (type: ProtokolA2C | ProtokolC2A, data?: ArrayBuffer) => Uint8Array;
export declare const isMobileCardPacket: (data: Uint8Array) => boolean;
export declare const checkPacket: (packet: Uint8Array) => void;
export declare const parsePacket: (packet: Uint8Array) => {
    type: ProtokolC2A;
    data: Uint8Array;
};
export declare const decodeRfidData: (data: Uint8Array) => {
    cardIdBase64: string;
    signatureBase64: string;
};
export declare const createPingPacket: (numCode: number) => Uint8Array;
export declare const decodePongData: (data: Uint8Array) => number;
export declare const createDisplayPacket: (lineOne: string, lineTwo: string) => Uint8Array;
export declare const createSpaydPacket: (spayd: string) => Uint8Array;
export declare const createSendSPAYdPacket: (spayd: string) => Uint8Array;
