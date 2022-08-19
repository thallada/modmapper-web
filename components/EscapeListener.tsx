import React, { useCallback, useEffect } from "react";

type Props = {
  onEscape: () => void;
};

const EscapeListener: React.FC<Props> = ({ onEscape }) => {
  const keyHandler = useCallback(
    (event) => {
      switch (event.keyCode) {
        case 27: // escape key
          onEscape();
          break;
        default:
          break;
      }
    },
    [onEscape]
  );

  useEffect(() => {
    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, [keyHandler]);

  return null;
};

export default EscapeListener;
