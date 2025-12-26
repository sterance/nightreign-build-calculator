import { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';
import { generatePairingCode, formatPairingCode } from '../utils/crypto';
import { createSenderPeer, createReceiverPeer, sendData, receiveData } from '../utils/peerjs';
import QRCode from 'react-qr-code';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';

const TransferPage = ({ onBack, addToast, setHasRelicData, setHasSavedBuilds }) => {
  const [pairingCode, setPairingCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [receiveStatus, setReceiveStatus] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [showSendCode, setShowSendCode] = useState(false);
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const initializedRef = useRef(false);
  const scannerRef = useRef(null);

  const cleanupPeerConnection = async () => {
    console.log('[TransferPage] cleanupPeerConnection: cleaning up old connections...');
    // Close and remove connection first
    if (connectionRef.current) {
      try {
        // Remove all event listeners if method exists
        if (typeof connectionRef.current.removeAllListeners === 'function') {
          connectionRef.current.removeAllListeners();
        }
        connectionRef.current.close();
        console.log('[TransferPage] cleanupPeerConnection: connection closed');
      } catch (err) {
        console.error('[TransferPage] cleanupPeerConnection: error closing connection:', err);
      }
      connectionRef.current = null;
    }
    
    // Disconnect and destroy peer
    if (peerRef.current) {
      try {
        if (!peerRef.current.destroyed) {
          // Remove all event listeners if method exists
          if (typeof peerRef.current.removeAllListeners === 'function') {
            peerRef.current.removeAllListeners();
          }
          // Disconnect first if connected
          if (peerRef.current.open) {
            peerRef.current.disconnect();
            console.log('[TransferPage] cleanupPeerConnection: peer disconnected');
            // Wait a bit for disconnect to complete
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          // Then destroy
          peerRef.current.destroy();
          console.log('[TransferPage] cleanupPeerConnection: peer destroyed');
        }
      } catch (err) {
        console.error('[TransferPage] cleanupPeerConnection: error destroying peer:', err);
      }
      peerRef.current = null;
    }
    
    // Longer delay to ensure cleanup completes and server processes the disconnection
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const handleGenerateSendCode = async () => {
    // Clean up any existing connections first
    await cleanupPeerConnection();
    
    // Reset state
    setPairingCode('');
    setShowSendCode(false);
    setSendStatus('');
    setIsTransferring(false);
    setTransferProgress(0);
    
    // Generate a new code - if connection fails, we'll generate another one
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[TransferPage] handleGenerateSendCode: attempt ${attempts}/${maxAttempts} - generating pairing code...`);
      const code = generatePairingCode();
      console.log('[TransferPage] handleGenerateSendCode: pairing code generated:', code);
      setPairingCode(code);
      setShowSendCode(true);
      setSendStatus('connecting to signaling server...');

      try {
        console.log('[TransferPage] handleGenerateSendCode: creating sender peer...');
        const { peer, connection } = await createSenderPeer(code);
        console.log('[TransferPage] handleGenerateSendCode: sender peer created, connection open:', connection.open);
        peerRef.current = peer;
        connectionRef.current = connection;

      const handleConnectionOpen = () => {
        console.log('[TransferPage] handleGenerateSendCode: connection opened, ready to transfer');
        setSendStatus('receiver connected - ready to transfer');
        startTransfer();
      };

      if (connection.open) {
        console.log('[TransferPage] handleGenerateSendCode: connection already open, starting transfer immediately');
        setSendStatus('receiver connected - ready to transfer');
        startTransfer();
      } else {
        setSendStatus('waiting for receiver to connect...');
        connection.on('open', handleConnectionOpen);
      }

      connection.on('error', (error) => {
        console.error('[TransferPage] handleGenerateSendCode: connection error:', error);
        setSendStatus('connection error: ' + error);
        addToast('Connection error occurred', 'error');
      });

      connection.on('close', () => {
        console.log('[TransferPage] handleGenerateSendCode: connection closed');
        setSendStatus('connection closed');
      });

      peer.on('error', (error) => {
        console.error('[TransferPage] handleGenerateSendCode: peer error:', error);
        if (error.type === 'peer-unavailable') {
          setSendStatus('waiting for receiver... (make sure they entered the code)');
        } else {
          setSendStatus('error: ' + error.message);
          addToast('Connection error: ' + error.message, 'error');
        }
      });
        
        // Success - break out of retry loop
        break;
      } catch (error) {
        console.error(`[TransferPage] handleGenerateSendCode: attempt ${attempts} failed:`, error);
        // Clean up failed attempt
        await cleanupPeerConnection();
        
        if (attempts >= maxAttempts) {
          setSendStatus('error: ' + error.message);
          addToast('Failed to create connection after multiple attempts. Please try again.', 'error');
          setShowSendCode(false);
          setPairingCode('');
        } else {
          // Wait before retrying with a new code
          console.log(`[TransferPage] handleGenerateSendCode: waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Continue loop to generate new code
        }
      }
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.destroy();
      }
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, []);


  const startTransfer = async () => {
    console.log('[TransferPage] startTransfer: called');
    try {
      setIsTransferring(true);
      setSendStatus('transferring data...');
      setTransferProgress(0);

      const dataToTransfer = {
        saveData: localStorage.getItem('saveData'),
        savedBuilds: localStorage.getItem('savedBuilds'),
        userOptions: localStorage.getItem('userOptions'),
      };

      console.log('[TransferPage] startTransfer: data prepared, saveData length:', dataToTransfer.saveData?.length || 0);
      console.log('[TransferPage] startTransfer: connection open:', connectionRef.current?.open);
      console.log('[TransferPage] startTransfer: sending data...');
      await sendData(connectionRef.current, dataToTransfer);
      console.log('[TransferPage] startTransfer: data sent successfully');
      setTransferProgress(100);
      setSendStatus('transfer complete!');
      addToast('Data transferred successfully', 'success');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('[TransferPage] startTransfer: error:', error);
      setSendStatus('transfer failed: ' + error.message);
      addToast('Transfer failed: ' + error.message, 'error');
      setIsTransferring(false);
    }
  };

  const handleReceive = async () => {
    console.log('[TransferPage] handleReceive: called');
    if (!codeInput.trim()) {
      console.log('[TransferPage] handleReceive: validation failed - missing code');
      addToast('Please enter the pairing code', 'error');
      return;
    }

    const cleanCode = codeInput.trim().replace(/-/g, '');
    if (cleanCode.length !== 8) {
      addToast('Invalid code. Please enter an 8-character code.', 'error');
      return;
    }

    handleReceiveWithCode(cleanCode);
  };

  const handleDataReceived = (data) => {
    try {
      setReceiveStatus('data received - saving...');
      setTransferProgress(100);

      if (data.saveData) {
        localStorage.setItem('saveData', data.saveData);
        setHasRelicData(true);
      }
      if (data.savedBuilds) {
        localStorage.setItem('savedBuilds', data.savedBuilds);
        setHasSavedBuilds(true);
      }
      if (data.userOptions) {
        localStorage.setItem('userOptions', data.userOptions);
      }

      setReceiveStatus('transfer complete!');
      addToast('Data received and saved successfully', 'success');
      setTimeout(() => {
        onBack();
        window.location.reload();
      }, 2000);
    } catch (error) {
      setReceiveStatus('save failed: ' + error.message);
      addToast('Failed to save received data: ' + error.message, 'error');
    }
  };

  const handleCodeInputChange = (e) => {
    const input = e.target.value;
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
    
    // Format with hyphen after 4th character
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    
    setCodeInput(formatted);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (error) {
        console.error('[TransferPage] stopScanner: error stopping scanner:', error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanQRCode = () => {
    console.log('[TransferPage] handleScanQRCode: called');
    setIsScanning(true);
  };

  useEffect(() => {
    if (!isScanning) return;

    const initializeScanner = async () => {
      // Wait for the DOM element to be available
      const element = document.getElementById('qr-reader');
      if (!element) {
        const errorMsg = 'qr-reader element not found';
        console.error('[TransferPage] useEffect:', errorMsg);
        setIsScanning(false);
        addToast('Scanner element not found. Please try again.', 'error');
        return;
      }
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const onScanSuccess = (decodedText, decodedResult) => {
          console.log('[TransferPage] useEffect: QR code scanned:', decodedText);
          console.log('[TransferPage] useEffect: decoded result:', decodedResult);
          // Validate the scanned code
          const cleaned = decodedText.trim().replace(/[^A-Z0-9]/gi, '').toUpperCase();
          
          if (cleaned.length !== 8) {
            const errorMsg = `Invalid code length: ${cleaned.length}, expected 8`;
            console.error('[TransferPage] useEffect:', errorMsg);
            addToast(`Invalid QR code (length: ${cleaned.length}). Expected 8 characters.`, 'error');
            return;
          }

          // Stop scanner and close modal
          stopScanner().then(() => {
            // Set the code input and trigger receive
            const formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
            setCodeInput(formatted);
            // Use the cleaned code (no hyphen) for connection
            handleReceiveWithCode(cleaned);
          });
        };

        const onScanError = (errorMessage) => {
          // Ignore frequent scan errors (normal during scanning)
          // These are expected when no QR code is in view
          const ignoredErrors = [
            'No QR code found',
            'NotFoundException',
            'No barcode or QR code detected',
            'QR code parse error'
          ];
          const shouldIgnore = ignoredErrors.some(err => errorMessage.includes(err));
          if (!shouldIgnore) {
            console.log('[TransferPage] useEffect: scan error:', errorMessage);
          }
        };

        // Try to get available cameras first for better error handling
        let cameraId = null;
        try {
          const cameras = await Html5Qrcode.getCameras();
          console.log('[TransferPage] useEffect: available cameras:', cameras.length);
          if (cameras.length > 0) {
            // Prefer back camera (environment) on mobile
            const backCamera = cameras.find(cam => cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('rear'));
            cameraId = backCamera ? backCamera.id : cameras[0].id;
            console.log('[TransferPage] useEffect: using camera:', cameraId);
          }
        } catch (err) {
          console.log('[TransferPage] useEffect: could not enumerate cameras, using default:', err);
        }

        const config = {
          fps: 10,
          aspectRatio: 1.0,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Use a larger scan area for better detection (almost full screen)
            const minEdgePercentage = 0.9;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          disableFlip: false,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        let started = false;
        
        if (cameraId) {
          try {
            await scanner.start(cameraId, config, onScanSuccess, onScanError);
            console.log('[TransferPage] useEffect: camera started successfully (by ID)');
            started = true;
          } catch (err) {
            console.error('[TransferPage] useEffect: start by ID failed:', err);
          }
        }
        
        if (!started) {
          // Try facingMode: environment (back camera)
          try {
            await scanner.start(
              { facingMode: "environment" },
              config,
              onScanSuccess,
              onScanError
            );
            console.log('[TransferPage] useEffect: camera started successfully (environment)');
            started = true;
          } catch (err) {
            console.error('[TransferPage] useEffect: environment camera failed:', err);
          }
        }
        
        if (!started) {
          // Try facingMode: user (front camera) as last resort
          try {
            await scanner.start(
              { facingMode: "user" },
              config,
              onScanSuccess,
              onScanError
            );
            console.log('[TransferPage] useEffect: camera started successfully (user)');
            started = true;
          } catch (err) {
            console.error('[TransferPage] useEffect: user camera failed:', err);
          }
        }
        
        if (!started) {
          throw new Error('All camera start attempts failed');
        }
      } catch (error) {
        const errorName = error?.name || 'UnknownError';
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        console.error('[TransferPage] useEffect: scanner error:', error);
        console.error('[TransferPage] useEffect: error type:', errorName);
        console.error('[TransferPage] useEffect: error message:', errorMsg);
        setIsScanning(false);
        
        let errorMessage = 'Failed to start camera. ';
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          errorMessage = 'Camera permission denied. Please enable camera access in your browser settings and try again.';
        } else if (error.name === 'NotFoundError' || error.message.includes('NotFoundError') || error.message.includes('No camera')) {
          errorMessage = 'No camera found. Please use manual code entry.';
        } else if (error.name === 'NotReadableError' || error.message.includes('NotReadableError')) {
          errorMessage = 'Camera is already in use by another application. Please close other apps and try again.';
        } else if (error.message) {
          errorMessage += error.message;
        }
        
        addToast(errorMessage, 'error');
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeScanner, 200);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [isScanning]);

  const handleReceiveWithCode = async (code) => {
    console.log('[TransferPage] handleReceiveWithCode: called with code:', code);
    if (!code || code.length !== 8) {
      addToast('Invalid code. Please enter an 8-character code.', 'error');
      return;
    }

    try {
      setReceiveStatus('connecting to signaling server...');

      console.log('[TransferPage] handleReceiveWithCode: creating receiver peer...');
      const { peer, connection } = await createReceiverPeer(code);
      console.log('[TransferPage] handleReceiveWithCode: receiver peer created, connection open:', connection.open);
      peerRef.current = peer;
      connectionRef.current = connection;

      const startReceiving = async () => {
        console.log('[TransferPage] handleReceiveWithCode: connection opened');
        setReceiveStatus('connection established - waiting for data...');
        try {
          console.log('[TransferPage] handleReceiveWithCode: calling receiveData...');
          const receivedData = await receiveData(connection);
          console.log('[TransferPage] handleReceiveWithCode: data received');
          handleDataReceived(receivedData);
        } catch (error) {
          console.error('[TransferPage] handleReceiveWithCode: receiveData error:', error);
          setReceiveStatus('receive failed: ' + error.message);
          addToast('Failed to receive data: ' + error.message, 'error');
        }
      };

      if (connection.open) {
        console.log('[TransferPage] handleReceiveWithCode: connection already open, starting receive immediately');
        startReceiving();
      } else {
        setReceiveStatus('waiting for sender to connect...');
        connection.on('open', startReceiving);
      }

      connection.on('error', (error) => {
        console.error('[TransferPage] handleReceiveWithCode: connection error:', error);
        setReceiveStatus('connection error: ' + error);
        addToast('Connection error occurred', 'error');
      });

      connection.on('close', () => {
        console.log('[TransferPage] handleReceiveWithCode: connection closed');
        setReceiveStatus('connection closed');
      });

      peer.on('error', (error) => {
        console.error('[TransferPage] handleReceiveWithCode: peer error:', error);
        setReceiveStatus('error: ' + error.message);
        addToast('Connection error: ' + error.message, 'error');
      });
    } catch (error) {
      console.error('[TransferPage] handleReceiveWithCode: error:', error);
      setReceiveStatus('error: ' + error.message);
      addToast('Failed to connect: ' + error.message, 'error');
    }
  };

  return (
    <div className="settings-page-backdrop">
      <div className="settings-page card">
        <div className='card-header'>
          <button className="corner-button" onClick={onBack}><CloseIcon /></button>
        </div>
        <h2>Transfer Data</h2>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Send</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {showSendCode && pairingCode ? (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formatPairingCode(pairingCode)}
                      readOnly
                      style={{ flex: 1, padding: '0.5rem', fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px' }}>
                    <QRCode
                      value={pairingCode}
                      size={300}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                </>
              ) : (
                <button
                  className="transfer-button"
                  title='Generate Send Code'
                  onClick={handleGenerateSendCode}
                  disabled={isTransferring}
                  style={{ width: '100%' }}
                >
                  Generate Send Code
                </button>
              )}
              {isTransferring && (
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>Transferring... {transferProgress}%</div>
                  <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${transferProgress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Receive</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={codeInput}
                  onChange={handleCodeInputChange}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center', textTransform: 'uppercase' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="transfer-button"
                    title='Connect'
                    onClick={handleReceive}
                    disabled={!codeInput.trim() || isTransferring}
                    style={{ flex: 1 }}
                  >
                    Connect
                  </button>
                  <button
                    className="transfer-button"
                    title='Scan QR Code'
                    onClick={handleScanQRCode}
                    disabled={isScanning || isTransferring}
                    style={{ flex: 1 }}
                  >
                    Scan QR Code
                  </button>
                </div>
              </div>
              {isTransferring && (
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>Receiving... {transferProgress}%</div>
                  <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${transferProgress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isScanning && (
          <div className="scanner-overlay">
            <div className="scanner-modal">
              <div className="scanner-header">
                <h3>Scan QR Code</h3>
                <button className="corner-button" onClick={stopScanner}>
                  <CloseIcon />
                </button>
              </div>
              <div id="qr-reader" style={{ width: '100%', minHeight: '300px' }}></div>
              <div style={{ padding: '1rem', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                Point your camera at the QR code
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TransferPage;
