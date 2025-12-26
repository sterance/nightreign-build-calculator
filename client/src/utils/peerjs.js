import Peer from 'peerjs';

const CHUNK_SIZE = 64 * 1024;
const PEERJS_SERVERS = [
  { host: '0.peerjs.com', port: 443, path: '/', secure: true },
  { host: '1.peerjs.com', port: 443, path: '/', secure: true },
  { host: '2.peerjs.com', port: 443, path: '/', secure: true },
];

function getServerForCode(code) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % PEERJS_SERVERS.length;
  return PEERJS_SERVERS[index];
}

export function createSenderPeer(code) {
  console.log('[PeerJS] createSenderPeer: starting with code:', code);
  return new Promise((resolve, reject) => {
    const server = getServerForCode(code);
    console.log('[PeerJS] createSenderPeer: using server:', server.host);
    
    let peerOpened = false;
    let connectionReceived = false;
    const timeout = setTimeout(() => {
      if (!peerOpened) {
        console.error('[PeerJS] createSenderPeer: timeout waiting for peer to open');
        if (peer && !peer.destroyed) {
          peer.destroy();
        }
        reject(new Error('Connection timeout. Please try again.'));
      }
    }, 10000);
    
    const peer = new Peer(code, {
      host: server.host,
      port: server.port,
      path: server.path,
      secure: server.secure,
    });

    peer.on('open', (id) => {
      console.log('[PeerJS] createSenderPeer: peer opened with ID:', id);
      peerOpened = true;
      clearTimeout(timeout);
      console.log('[PeerJS] createSenderPeer: waiting for receiver to connect...');
    });

    peer.on('connection', (dataConnection) => {
      console.log('[PeerJS] createSenderPeer: connection received from receiver');
      connectionReceived = true;
      
      dataConnection.on('open', () => {
        console.log('[PeerJS] createSenderPeer: data connection opened');
        resolve({ peer, connection: dataConnection });
      });

      dataConnection.on('error', (error) => {
        console.error('[PeerJS] createSenderPeer: data connection error:', error);
        if (!connectionReceived) {
          reject(error);
        }
      });
    });

    peer.on('error', (error) => {
      console.error('[PeerJS] createSenderPeer: peer error:', error);
      clearTimeout(timeout);
      if (error.type === 'peer-unavailable') {
        reject(new Error('Peer not found. Make sure the receiver has entered the code and is waiting for connection.'));
      } else if (error.type === 'socket-error' || error.type === 'server-error' || error.message?.includes('Lost connection')) {
        reject(new Error('Failed to connect to signaling server. The peer ID may be in use. Please try generating a new code.'));
      } else {
        reject(error);
      }
    });

    peer.on('disconnected', () => {
      console.log('[PeerJS] createSenderPeer: peer disconnected');
    });

    peer.on('close', () => {
      console.log('[PeerJS] createSenderPeer: peer closed');
    });
  });
}

export function createReceiverPeer(code) {
  console.log('[PeerJS] createReceiverPeer: starting, connecting to code:', code);
  return new Promise((resolve, reject) => {
    const server = getServerForCode(code);
    console.log('[PeerJS] createReceiverPeer: using server:', server.host);
    
    const peer = new Peer(null, {
      host: server.host,
      port: server.port,
      path: server.path,
      secure: server.secure,
    });

    peer.on('open', (id) => {
      console.log('[PeerJS] createReceiverPeer: peer opened with ID:', id);
      console.log('[PeerJS] createReceiverPeer: connecting to sender with code:', code);
      
      const dataConnection = peer.connect(code);
      
      dataConnection.on('open', () => {
        console.log('[PeerJS] createReceiverPeer: data connection opened');
        resolve({ peer, connection: dataConnection });
      });

      dataConnection.on('error', (error) => {
        console.error('[PeerJS] createReceiverPeer: data connection error:', error);
        reject(error);
      });
    });

    peer.on('error', (error) => {
      console.error('[PeerJS] createReceiverPeer: peer error:', error);
      if (error.type === 'peer-unavailable') {
        reject(new Error('Sender not found. Make sure the sender has generated a code and is waiting.'));
      } else if (error.type === 'socket-error' || error.type === 'server-error') {
        reject(new Error('Failed to connect to signaling server. Please try again.'));
      } else {
        reject(error);
      }
    });

    peer.on('disconnected', () => {
      console.log('[PeerJS] createReceiverPeer: peer disconnected');
    });

    peer.on('close', () => {
      console.log('[PeerJS] createReceiverPeer: peer closed');
    });

    setTimeout(() => {
      if (!peer.destroyed && !peer.open) {
        reject(new Error('Connection timeout. Make sure the sender has generated a code and is waiting.'));
      }
    }, 30000);
  });
}

export function sendData(connection, data) {
  console.log('[PeerJS] sendData: called, connection open:', connection.open);
  return new Promise((resolve, reject) => {
    if (!connection.open) {
      console.log('[PeerJS] sendData: connection not open, waiting...');
      connection.on('open', () => {
        console.log('[PeerJS] sendData: connection opened, retrying sendData...');
        sendData(connection, data).then(resolve).catch(reject);
      });
      return;
    }

    console.log('[PeerJS] sendData: connection is open, preparing data...');
    const dataString = JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(dataString);
    const totalChunks = Math.ceil(dataBuffer.length / CHUNK_SIZE);
    console.log('[PeerJS] sendData: data size:', dataBuffer.length, 'total chunks:', totalChunks);
    let sentChunks = 0;

    const sendChunk = (index) => {
      const start = index * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, dataBuffer.length);
      const chunk = dataBuffer.slice(start, end);

      try {
        connection.send(chunk);
        sentChunks++;

        if (sentChunks < totalChunks) {
          setTimeout(() => sendChunk(sentChunks), 0);
        } else {
          const endMarker = new TextEncoder().encode("__TRANSFER_COMPLETE__");
          connection.send(endMarker);
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    };

    console.log('[PeerJS] sendData: sending metadata...');
    connection.send(JSON.stringify({ type: "start", totalChunks, totalSize: dataBuffer.length }));
    console.log('[PeerJS] sendData: metadata sent, starting chunk transmission...');
    sendChunk(0);
  });
}

export function receiveData(connection) {
  console.log('[PeerJS] receiveData: called, connection open:', connection.open);
  return new Promise((resolve, reject) => {
    if (!connection.open) {
      console.log('[PeerJS] receiveData: connection not open, waiting...');
      connection.on('open', () => {
        console.log('[PeerJS] receiveData: connection opened, retrying receiveData...');
        receiveData(connection).then(resolve).catch(reject);
      });
      return;
    }

    console.log('[PeerJS] receiveData: connection is open, setting up message handler...');
    const chunks = [];
    let metadata = null;
    let totalSize = 0;

    const processMessage = async (data) => {
      let uint8Array;
      if (data instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(data);
      } else if (data instanceof Uint8Array) {
        uint8Array = data;
      } else if (data instanceof Blob) {
        const arrayBuffer = await data.arrayBuffer();
        uint8Array = new Uint8Array(arrayBuffer);
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "start") {
            console.log('[PeerJS] receiveData: metadata received, totalChunks:', parsed.totalChunks, 'totalSize:', parsed.totalSize);
            metadata = parsed;
            totalSize = parsed.totalSize;
            return true;
          }
        } catch {
        }
        return false;
      } else {
        return false;
      }

      const dataString = new TextDecoder().decode(uint8Array);
      if (dataString === "__TRANSFER_COMPLETE__") {
        console.log('[PeerJS] receiveData: transfer complete marker received, chunks:', chunks.length, 'totalSize:', totalSize);
        const combined = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        console.log('[PeerJS] receiveData: chunks combined, parsing JSON...');

        try {
          const jsonString = new TextDecoder().decode(combined);
          const receivedData = JSON.parse(jsonString);
          console.log('[PeerJS] receiveData: JSON parsed successfully');
          resolve(receivedData);
        } catch (error) {
          console.error('[PeerJS] receiveData: JSON parse error:', error);
          reject(new Error("Failed to parse received data: " + error.message));
        }
        return true;
      } else {
        chunks.push(uint8Array);
        console.log('[PeerJS] receiveData: chunk received, total chunks:', chunks.length);
        return true;
      }
    };

    connection.on('data', async (data) => {
      console.log('[PeerJS] receiveData: data received, type:', typeof data, 'isArrayBuffer:', data instanceof ArrayBuffer, 'isBlob:', data instanceof Blob);
      await processMessage(data);
    });

    connection.on('error', (error) => {
      reject(new Error("Data connection error: " + error));
    });

    connection.on('close', () => {
      if (chunks.length > 0 && chunks.length < (metadata?.totalChunks || Infinity)) {
        reject(new Error("Connection closed before transfer completed"));
      }
    });
  });
}

