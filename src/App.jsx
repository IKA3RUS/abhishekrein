import React, { useState } from 'react';
import useMeasure from 'react-use-measure';
import { motion } from 'framer-motion';

import Marquee from './components/Marquee/Marquee';
import Ball from './components/Ball/Ball';

import useCopyToClipboard from './hooks/useCopyToClipboard';

import './app.scss';

import logo from './assets/images/logo.svg';
import openInNewTabIcon from './assets/icons/ic_baseline-arrow-circle-right-up.svg';
import emailIcon from './assets/icons/ic_sharp-email.svg';

function App() {
  const [backgroundContainerRef, backgroundContainerBounds] = useMeasure();

  const email = 'w@abhishekrein.xyz';
  const [isEmailCopied, copyEmailToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="app">
      <div className="content">
        <header>
          <a className="button name" href="https://abhishekrein.xyz">
            <img className="icon" src={logo} alt="Abhishek Rein's Logo" />
            {/* abhishek rein */}
          </a>
          <a className="button resume" href={`${process.env.PUBLIC_URL}/resume.pdf`} target="_blank" rel="noreferrer">
            resume
            <img className="icon" src={openInNewTabIcon} alt="Open In New Tab" />
          </a>
        </header>
        <main>
          <Marquee className="tagline">
            I create
            {' '}
            <span className="fancy-font">human centered</span>
            {' '}
            eye candy.
          </Marquee>
          <motion.button
            className="button email"
            type="button"
            onClick={() => {
              copyEmailToClipboard(email);
            }}
            style={{
              pointerEvents: isEmailCopied ? 'none' : 'auto',
              // lineS
            }}
            layout
            transition={{ duration: 0.1 }}
          >
            <img className="icon" src={emailIcon} alt="Email icon" />
            {!isEmailCopied ? email : 'Copied. Let\'s get talking!'}
          </motion.button>
        </main>
        <div className="wave-wave" />
        <div className="wave-base">
          WIP. Designed in Figma, developed with ReactJS, made with UWU by Abhishek Rein.
        </div>
      </div>
      <div
        className="background"
        ref={backgroundContainerRef}
      >
        <Ball ballColorVariant="variant-one" containerBounds={backgroundContainerBounds} />
        <Ball ballColorVariant="variant-two" containerBounds={backgroundContainerBounds} />
        <div className="noise" />
      </div>
    </div>
  );
}

export default App;
