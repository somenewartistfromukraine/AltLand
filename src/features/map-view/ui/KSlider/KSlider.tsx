import React from 'react';

interface KSliderProps {
  k: number;
  onKChange: (newK: number) => void;
}

const KSlider: React.FC<KSliderProps> = ({ k, onKChange }) => {
  return (
    <div className="k-slider-container">
      <input
        id="k-slider"
        title="Виділити западини <--O--> Виділити висоти"
        type="range"
        min="-1"
        max="1"
        step="0.05"
        value={k}
        onChange={(e) => onKChange(parseFloat(e.target.value))}
        className="k-slider"
      />
    </div>
  );
};

export default KSlider;
