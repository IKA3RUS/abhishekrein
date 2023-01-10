import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import useMeasure from 'react-use-measure';
import './marquee.scss';

function Marquee({ className, gap, children }) {
  const [pxToMove, setPxToMove] = useState(0);

  const [trackRef, trackBounds] = useMeasure();

  useEffect(() => {
    setPxToMove(-1 * (trackBounds.width + gap));
  }, [trackBounds.width]);

  const moveVariants = {
    animate: {
      x: [0, pxToMove],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: 25,
          ease: 'linear',
        },
      },
    },
  };

  return (
    <div className={className}>
      <div className="marquee">
        <motion.div
          className="move"
          variants={moveVariants}
          animate="animate"
          style={{ gap }}
        >
          <div className="track" ref={trackRef}>
            {children}
          </div>
          <div className="track">
            {children}
          </div>
          <div className="track">
            {children}
          </div>
          <div className="track">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

Marquee.propTypes = {
  className: PropTypes.string,
  gap: PropTypes.number,
  children: PropTypes.node,
};

Marquee.defaultProps = {
  className: null,
  gap: 100,
  children: null,
};

export default Marquee;
