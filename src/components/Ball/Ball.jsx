import React, {
  useState, useCallback, useRef, useEffect,
} from 'react';
import useMeasure from 'react-use-measure';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { motion } from 'framer-motion';

function Ball({ ballColorVariant, containerBounds }) {
  const [ref, bounds] = useMeasure();
  const [nextPos, setNextPos] = useState();

  const getRandomInt = (argmin, argmax) => {
    const min = Math.ceil(argmin);
    const max = Math.floor(argmax);
    return Math.floor(Math.random() * (max - min) + min);
  };

  const moveBall = () => {
    setNextPos({
      x: getRandomInt(containerBounds.left, containerBounds.right - bounds.width),
      y: getRandomInt(containerBounds.top, containerBounds.bottom - bounds.height),
    });
  };

  useEffect(() => {
    setNextPos(bounds);
  }, []);

  const className = classNames('ball', ballColorVariant);

  return (
    <motion.div
      className={className}
      ref={ref}
      animate={{
        // nextPos is not defined until after the first DOM render.
        // The optional chaining prevents a runtime error from that.
        x: nextPos?.x ? nextPos.x : 100,
        y: nextPos?.y ? nextPos.y : 100,
      }}
      transition={{
        type: 'tween', ease: 'linear', duration: 10,
      }}
      onAnimationComplete={moveBall}
      // drag
      // dragMomentum={false}
      // onDragEnd={
      //   (event, info) => { setNextPos(bounds); }
      // }
    />
  );
}

Ball.propTypes = {
  ballColorVariant: PropTypes.string.isRequired,
  containerBounds: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }).isRequired,
};

export default Ball;
