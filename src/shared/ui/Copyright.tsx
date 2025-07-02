import React from 'react';

const Copyright: React.FC = () => {
  const email = 'horizon.in.ukraine@gmail.com';
  const subject = 'Горизонт.Зауваження та пропозиції';
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="bottom-panel copyright-container" title="Зауваження та пропозиції">
      <a href={mailtoLink}>
        Горизонт © 2025 RS
      </a>
    </div>
  );
};

export default Copyright;
