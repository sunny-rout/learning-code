import React from 'react';

interface AriaLiveRegionProps {
  message: string;
  role?: 'status' | 'alert';
  'aria-live'?: 'polite' | 'assertive';
}

/**
 * Screen-reader live region component.
 * Visually hidden using standard screen-reader classes (sr-only).
 * Dispatches polite announcements for asynchronous feedback without duplicating heading focus.
 */
export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  message,
  role = 'status',
  'aria-live': ariaLive = 'polite',
}) => {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
