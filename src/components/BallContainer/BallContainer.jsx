import React, {
  useState, useEffect, useRef, forwardRef,
} from 'react';
import PropTypes from 'prop-types';
import Ball from '../Ball/Ball';

const BallContainer = forwardRef(({ className, ...props }, ref) => (
  <div
    className={className}
    ref={ref}
  />
));

BallContainer.propTypes = {
  className: PropTypes.string.isRequired,
};

export default BallContainer;
