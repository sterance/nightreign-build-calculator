import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const RelicResultsPopout = ({ children, onClose, openPopoutInNewTab }) => {
  const [container, setContainer] = useState(null);
  const newWindow = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const popoutWindow = window.open(
      '',
      '',
      openPopoutInNewTab ? '' : 'width=1500,height=700,left=100,top=100,resizable=yes,scrollbars=yes'
    );

    if (!popoutWindow) {
      console.error('Failed to open pop-out window. Check if pop-ups are blocked in your browser.');
      addToast('Failed to open pop-out window. Check if pop-ups are blocked in your browser.', 'error');
      onCloseRef.current?.();
      return;
    }

    newWindow.current = popoutWindow;
    popoutWindow.document.title = 'Relic Results - Nightreign Build Calculator';

    document.querySelectorAll('style').forEach(styleTag => {
      const newStyle = popoutWindow.document.createElement('style');
      newStyle.textContent = styleTag.textContent;
      popoutWindow.document.head.appendChild(newStyle);
    });

    document.querySelectorAll('link[rel="stylesheet"]').forEach(linkTag => {
      const newLink = popoutWindow.document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = linkTag.href;
      popoutWindow.document.head.appendChild(newLink);
    });

    const containerDiv = popoutWindow.document.createElement('div');
    popoutWindow.document.body.appendChild(containerDiv);
    setContainer(containerDiv);

    const handleBeforeUnload = () => {
      onCloseRef.current?.();
    };

    popoutWindow.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      popoutWindow.removeEventListener('beforeunload', handleBeforeUnload);
      if (popoutWindow && !popoutWindow.closed) {
        popoutWindow.close();
      }
    };
  }, []);

  return container && createPortal(children, container);
};

export default RelicResultsPopout;