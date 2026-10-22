import { KisReaderClient } from "./Client.js";
import { createSpaydPacket } from "./packet.js";
export { KisReaderClient } from "./Client.js";
export { KisReaderWrapperClient } from "./WrapperClient.js";
export { KisReaderSimpleClient } from "./SimpleClient.js";
export { ReaderState } from "./IClient.js";
export { createSpaydPacket, createSendSPAYdPacket } from "./packet.js";
export const readOneCard = (readerUri, onData, onError, onConnect) => {
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
    });
    client.connect();
    return () => {
        client.disconnectedEvent.offOnce(onError);
        client.disconnect();
    };
};
export const testReader = (readerUri, onResult) => {
    if (!(readerUri.startsWith("ws://") || readerUri.startsWith("wss://")))
        readerUri = "wss://" + readerUri;
    let client = new KisReaderClient(readerUri);
    client.connectedEvent.once(() => onResult(true));
    client.connectedEvent.once(() => client.disconnect());
    client.errorEvent.once(() => onResult(false));
    client.connect();
};
export const sendSPAYd = (target, spayd) => {
    if (target instanceof KisReaderClient) {
        target.sendSPAYd(spayd);
    }
    else if (target && typeof target.send === 'function') {
        const packet = createSpaydPacket(spayd);
        target.send(packet);
    }
    else {
        throw new Error("Invalid target: must be a KisReaderClient or WebSocket instance");
    }
};
export const sendSpayd = sendSPAYd;
//# sourceMappingURL=lib.js.map