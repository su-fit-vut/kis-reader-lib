import { KisReaderClient } from "./Client";
import { createSpaydPacket, createSendSPAYdPacket } from "./packet";

export { KisReaderClient } from "./Client";
export { KisReaderWrapperClient } from "./WrapperClient";
export { KisReaderSimpleClient } from "./SimpleClient";
export { ReaderState } from "./IClient";
export { createSpaydPacket, createSendSPAYdPacket } from "./packet";

// takes URI, onData, onError, onConnect(optional) callbacks, returns disconnect lambda
export const readOneCard = (readerUri: string, onData: (data: string) => void, onError: (err: any) => void, onConnect?: () => void) : (() => void) => {
    if (!(readerUri.startsWith("ws://") || readerUri.startsWith("wss://")))
        readerUri = "wss://" + readerUri;
    let client = new KisReaderClient(readerUri);
    client.disconnectedEvent.once(onError);
    client.connectedEvent.once(reader => reader.modeSingleRead());
    if (onConnect)
        client.connectedEvent.once(onConnect);
    client.cardReadEvent.once(ev => {
        client.disconnectedEvent.offOnce(onError);
        client.disconnect();
        onData(ev.cardData);
    })
    client.connect();
    return () => {
        client.disconnectedEvent.offOnce(onError);
        client.disconnect();
    }
};

// for testing the availability of the reader - will likely fail on alredy-connected reader
// takes URI, onResult callbacks, returns nothing
export const testReader = (readerUri: string, onResult: (success: boolean) => void) : void => {
    if (!(readerUri.startsWith("ws://") || readerUri.startsWith("wss://")))
        readerUri = "wss://" + readerUri;

    let client = new KisReaderClient(readerUri);
    client.connectedEvent.once(() => onResult(true));
    client.connectedEvent.once(() => client.disconnect());
    client.errorEvent.once(() => onResult(false));
    client.connect();
}

// Send a SPAYD string over websocket to ctecka
// accepts a connected KisReaderClient or a raw WebSocket instance
export const sendSPAYd = (target: KisReaderClient | WebSocket, spayd: string): void => {
    if (target instanceof KisReaderClient) {
        target.sendSPAYd(spayd);
    } else if (target && typeof (target as any).send === 'function') {
        const packet = createSpaydPacket(spayd);
        target.send(packet);
    } else {
        throw new Error("Invalid target: must be a KisReaderClient or WebSocket instance");
    }
};

export const sendSpayd = sendSPAYd;
