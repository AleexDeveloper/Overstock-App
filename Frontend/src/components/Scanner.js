javascript
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { Button } from './ui/button';

export const Scanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  // Function to play beep sound
  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  useEffect(() => {
  const scanner = new Html5Qrcode('qr-reader');
  scannerRef.current = scanner;

  const startScanner = async () => {
    try {
      // Iniciamos solo cuando el componente aparece
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 }
        },
        (decodedText) => {
          playBeep();
          // Detenemos la cámara INMEDIATAMENTE tras el éxito
          scanner.stop().then(() => {
            onScan(decodedText); 
          });
        },
        (errorMessage) => { /* Errores de lectura ignorados */ }
      );
      setIsScanning(true);
    } catch (err) {
      setError('No se pudo acceder a la cámara.');
    }
  };

  startScanner();

  // ESTA ES LA CLAVE: Cuando sales de la pantalla (unmount), apagamos todo
  return () => {
    if (scanner.isScanning) {
      scanner.stop()
        .then(() => console.log("Cámara desactivada"))
        .catch(err => console.error("Error al apagar cámara", err));
    }
  };
}, [onScan]);

  const handleClose = async () => {
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" data-testid="scanner-overlay">
      <div className="relative h-full w-full">
        <div className="absolute top-4 right-4 z-[60]">
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white"
            data-testid="scanner-close-btn"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute top-8 left-0 right-0 text-center z-[60]">
          <div className="bg-black/50 backdrop-blur-sm inline-block px-6 py-3 rounded-lg">
            <div className="flex items-center gap-2 text-white">
              <Camera className="h-5 w-5" />
              <span className="text-sm font-medium">Escanea el código de barras o QR</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="absolute top-24 left-4 right-4 z-[60]">
            <div className="bg-red-500/90 text-white px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        <div id="qr-reader" className="w-full h-full"></div>

        {isScanning && (
          <>
            <div className="scanner-overlay"></div>
            <div className="scanner-overlay">
              <div className="scanner-line"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};