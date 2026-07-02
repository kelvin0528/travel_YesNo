/**
 * THE FOOD JUDGE - INTERACTIVE LOGIC & ANIMATIONS (GSAP)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE VARIABLES ---
  let isMuted = false;
  let audioCtx = null;
  let activeTimeline = null;
  let idleAnims = [];
  let isTransitioning = false;
  let currentVerdict = null; // 'correct', 'wrong', or null

  // --- SELECTORS ---
  const screenIntro = document.getElementById('screen-intro');
  const screenJudge = document.getElementById('screen-judge');
  const btnStart = document.getElementById('btn-start');
  const btnReset = document.getElementById('btn-reset');
  const soundToggle = document.getElementById('sound-toggle');

  const paddlesArena = document.getElementById('paddles-arena');
  const paddleCorrect = document.getElementById('paddle-correct');
  const paddleWrong = document.getElementById('paddle-wrong');
  const wrapCorrect = document.getElementById('wrap-correct');
  const wrapWrong = document.getElementById('wrap-wrong');

  const statusText = document.getElementById('status-text');
  const instructionsText = document.getElementById('judge-instructions');

  const washCorrect = document.getElementById('wash-correct');
  const washWrong = document.getElementById('wash-wrong');

  const verdictOverlay = document.getElementById('verdict-overlay');
  const verdictTitle = document.getElementById('v-title');
  const verdictDesc = document.getElementById('v-desc');
  const verdictBadge = document.getElementById('v-badge');

  // --- AUDIO SYNTH ENGINE (Web Audio API) ---
  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  const playSound = (type) => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    switch (type) {
      case 'click': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'swipe': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'correct': {
        // 1. Sub Bass Drop
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(130, now);
        subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
        subGain.gain.setValueAtTime(0.3, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.8);

        // 2. Bright Chime Chord (C Major: C5, E5, G5, C6)
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.05); // slight arpeggio
          gain.gain.setValueAtTime(0.05, now + index * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7 + index * 0.05);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + index * 0.05);
          osc.stop(now + 0.8 + index * 0.05);
        });
        break;
      }
      case 'wrong': {
        // 1. Low Gritty Saw Rumble
        const lowOsc = audioCtx.createOscillator();
        const lowGain = audioCtx.createGain();
        lowOsc.type = 'sawtooth';
        lowOsc.frequency.setValueAtTime(95, now);
        lowOsc.frequency.linearRampToValueAtTime(55, now + 0.6);
        lowGain.gain.setValueAtTime(0.18, now);
        lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        lowOsc.connect(lowGain);
        lowGain.connect(audioCtx.destination);
        lowOsc.start(now);
        lowOsc.stop(now + 0.6);

        // 2. Harsh Buzzer Dissonant Chime
        const buzzOsc = audioCtx.createOscillator();
        const buzzGain = audioCtx.createGain();
        buzzOsc.type = 'square';
        buzzOsc.frequency.setValueAtTime(145, now);
        buzzOsc.frequency.linearRampToValueAtTime(130, now + 0.4);
        buzzGain.gain.setValueAtTime(0.12, now);
        buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        buzzOsc.connect(buzzGain);
        buzzGain.connect(audioCtx.destination);
        buzzOsc.start(now);
        buzzOsc.stop(now + 0.4);
        break;
      }
      case 'reset': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
    }
  };

  // Sound toggle handler
  soundToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    soundToggle.classList.toggle('muted', isMuted);
    if (!isMuted) {
      initAudio();
      playSound('click');
    }
  });

  // Haptic Feedback wrapper
  const triggerHaptic = (pattern) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore haptic errors on unsupported/unauthorized systems
      }
    }
  };

  // --- HTML5 CANVAS PARTICLE ENGINE ---
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  const resizeCanvas = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type; // 'dust', 'correct', 'wrong'
      this.alpha = 1;
      this.decay = 0.01 + Math.random() * 0.02;

      if (type === 'dust') {
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -0.2 - Math.random() * 0.5;
        this.size = 1 + Math.random() * 2;
        this.color = `rgba(255, 255, 255, ${0.15 + Math.random() * 0.25})`;
      } else if (type === 'correct') {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2; // slightly upward bias
        this.size = 3 + Math.random() * 4;
        // Cyan-emerald spectrum
        const hue = 130 + Math.random() * 40;
        this.color = `hsla(${hue}, 100%, 65%, `;
      } else if (type === 'wrong') {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 10;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = 2 + Math.random() * 5;
        // Orange-crimson spectrum
        const hue = Math.random() > 0.5 ? 345 : 15;
        this.color = `hsla(${hue}, 100%, 55%, `;
      }
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.type === 'dust') {
        // Wrap edge boundaries for dust
        if (this.y < 0) this.y = h;
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
      } else {
        // Speed dampening for explosions
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.alpha -= this.decay;
      }
    }

    draw() {
      ctx.beginPath();
      if (this.type === 'dust') {
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'correct') {
        // Glowing circular sparks
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        grad.addColorStop(0, this.color + '1)');
        grad.addColorStop(1, this.color + '0)');
        ctx.fillStyle = grad;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'wrong') {
        // Rectangular/sharp sparks with directional trails
        ctx.strokeStyle = this.color + this.alpha + ')';
        ctx.lineWidth = this.size / 2;
        ctx.lineCap = 'round';
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5);
        ctx.stroke();
      }
    }
  }

  // Pre-fill dust particles
  for (let i = 0; i < 40; i++) {
    particles.push(new Particle(Math.random() * w, Math.random() * h, 'dust'));
  }

  // Explosion triggers
  const spawnExplosion = (x, y, type) => {
    const count = type === 'correct' ? 80 : 100;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, type));
    }
  };

  // Main Canvas Render Loop
  const animateParticles = () => {
    ctx.clearRect(0, 0, w, h);

    // Spawn subtle dust continuously
    if (particles.filter(p => p.type === 'dust').length < 40) {
      particles.push(new Particle(Math.random() * w, h, 'dust'));
    }

    particles = particles.filter(p => p.alpha > 0);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animateParticles);
  };
  requestAnimationFrame(animateParticles);


  // --- GSAP ANIMATION PRESETS & FLOATS ---
  const startIdleFloating = () => {
    // Kill existing idle animations
    idleAnims.forEach(anim => anim.kill());
    idleAnims = [];

    // Left Paddle Float
    const animLeft = gsap.to(wrapCorrect, {
      y: -12,
      rotation: -1.5,
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });

    // Right Paddle Float (out of phase)
    const animRight = gsap.to(wrapWrong, {
      y: 12,
      rotation: 1.5,
      duration: 3.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 0.4
    });

    idleAnims.push(animLeft, animRight);
  };

  const stopIdleFloating = () => {
    idleAnims.forEach(anim => anim.kill());
  };

  // 3D Parallax Tilt Effects
  const setup3DTilt = (wrapper, paddle) => {
    const handleMove = (e) => {
      if (isTransitioning || currentVerdict) return;

      const rect = wrapper.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;

      const xPercent = x / (rect.width / 2);
      const yPercent = y / (rect.height / 2);

      gsap.to(paddle, {
        rotateY: xPercent * 25,
        rotateX: -yPercent * 25,
        z: 15,
        duration: 0.25,
        ease: "power2.out"
      });
    };

    const handleLeave = () => {
      if (isTransitioning || currentVerdict) return;
      gsap.to(paddle, {
        rotateY: 0,
        rotateX: 0,
        z: 0,
        duration: 0.6,
        ease: "power3.out"
      });
    };

    // Mouse events
    wrapper.addEventListener('mousemove', handleMove);
    wrapper.addEventListener('mouseleave', handleLeave);

    // Touch events
    wrapper.addEventListener('touchmove', handleMove, { passive: true });
    wrapper.addEventListener('touchend', handleLeave);
  };

  setup3DTilt(wrapCorrect, paddleCorrect);
  setup3DTilt(wrapWrong, paddleWrong);


  // --- SCREEN TRANSITIONS ---

  // Intro -> Stage
  btnStart.addEventListener('click', () => {
    playSound('swipe');
    triggerHaptic(40);

    const introTl = gsap.timeline({
      onStart: () => {
        btnStart.style.pointerEvents = 'none';
      },
      onComplete: () => {
        screenIntro.classList.remove('active');
        screenJudge.classList.add('active');
        // Trigger arena entries
        playStageEntry();
      }
    });

    introTl.to(screenIntro.querySelector('.intro-content'), {
      y: -30,
      opacity: 0,
      duration: 0.5,
      ease: "power3.in"
    });
    introTl.to(screenIntro, {
      opacity: 0,
      duration: 0.4
    }, "-=0.2");
  });

  // Stage Entry Animation
  const playStageEntry = () => {
    gsap.set(screenJudge, { opacity: 1 });

    // Animate Header
    gsap.fromTo('.judge-header',
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power4.out" }
    );

    // Animate Footer
    gsap.fromTo(instructionsText,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 0.5, duration: 0.8, ease: "power4.out", delay: 0.2 }
    );

    // Animate Paddles (springy popup from the bottom)
    const paddlesTl = gsap.timeline({
      onComplete: () => {
        startIdleFloating();
      }
    });

    paddlesTl.fromTo([wrapCorrect, wrapWrong],
      { y: 400, scale: 0.3, opacity: 0, rotate: () => (Math.random() - 0.5) * 45 },
      { y: 0, scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: "back.out(1.1)", stagger: 0.15 }
    );
  };


  // --- JUDGMENT ACTION (SELECTION) ---

  const castVerdict = (verdict) => {
    if (isTransitioning || currentVerdict) return;

    isTransitioning = true;
    currentVerdict = verdict;
    stopIdleFloating();

    // Sound and Vibration
    playSound(verdict);
    triggerHaptic(verdict === 'correct' ? [50, 30, 50] : [100, 50, 150]);

    // Set Verdict Overlay content
    if (verdict === 'correct') {
      verdictTitle.innerText = "DELICIOUS";
      verdictDesc.innerText = "This dish is certified delicious. The Food Judge has spoken.";
      verdictBadge.innerText = "VERDICT: PASS";
      verdictOverlay.className = "verdict-overlay correct-verdict";
    } else {
      verdictTitle.innerText = "TERRIBLE";
      verdictDesc.innerText = "Absolute culinary failure. Cast out of the kitchen immediately.";
      verdictBadge.innerText = "VERDICT: FAIL";
      verdictOverlay.className = "verdict-overlay wrong-verdict";
    }

    statusText.innerText = "VERDICT DECLARED";
    statusText.classList.remove('pulse-alpha');

    // Get position of selected paddle head for particle center
    const activeWrap = verdict === 'correct' ? wrapCorrect : wrapWrong;
    const inactiveWrap = verdict === 'correct' ? wrapWrong : wrapCorrect;
    const activePaddle = verdict === 'correct' ? paddleCorrect : paddleWrong;

    const paddleRect = activePaddle.querySelector('.paddle-head').getBoundingClientRect();
    const containerRect = screenJudge.getBoundingClientRect();

    // Relative coordinates
    const pX = (paddleRect.left + paddleRect.width / 2) - containerRect.left;
    const pY = (paddleRect.top + paddleRect.height / 2) - containerRect.top;

    // Trigger canvas burst
    spawnExplosion(pX, pY, verdict);

    // Selection Timeline
    const selectTl = gsap.timeline({
      onComplete: () => {
        isTransitioning = false;
      }
    });

    // 1. Instantly fade out other elements
    selectTl.to(inactiveWrap, {
      opacity: 0,
      scale: 0.4,
      y: 200,
      rotate: verdict === 'correct' ? -45 : 45,
      duration: 0.6,
      ease: "power3.in"
    });

    selectTl.to(instructionsText, {
      opacity: 0,
      y: 20,
      duration: 0.4
    }, 0);

    // 2. Animate selected paddle to central screen focus
    // Calculate translation offset to center
    const arenaRect = paddlesArena.getBoundingClientRect();
    const wrapRect = activeWrap.getBoundingClientRect();
    const offsetX = (arenaRect.left + arenaRect.width / 2) - (wrapRect.left + wrapRect.width / 2);
    // Raise paddle up to upper half to clear the bottom text message
    const offsetY = -90;

    // Dynamic cinematic motion
    if (verdict === 'correct') {
      // Elegant vertical lift and spin flip
      selectTl.to(activeWrap, {
        x: offsetX,
        y: offsetY,
        scale: 1.25,
        duration: 0.8,
        ease: "power4.out"
      }, 0);

      selectTl.to(activePaddle, {
        rotateY: 360,
        duration: 0.8,
        ease: "back.out(1.2)"
      }, 0);

      // Fade in green wash background glow
      selectTl.to(washCorrect, {
        opacity: 1,
        duration: 0.8
      }, 0);

    } else {
      // Violent shake followed by lifting crash
      const shakeTl = gsap.timeline();
      for (let i = 0; i < 8; i++) {
        shakeTl.to(activePaddle, {
          x: (Math.random() - 0.5) * 15,
          y: (Math.random() - 0.5) * 15,
          rotate: (Math.random() - 0.5) * 8,
          duration: 0.04
        });
      }
      // Reset position before lift
      shakeTl.to(activePaddle, { x: 0, y: 0, rotate: 0, duration: 0.02 });

      selectTl.add(shakeTl, 0);

      // Now lift
      selectTl.to(activeWrap, {
        x: offsetX,
        y: offsetY,
        scale: 1.25,
        duration: 0.7,
        ease: "power2.out"
      }, 0.25);

      selectTl.to(activePaddle, {
        scale: 1.08,
        rotate: -10,
        duration: 0.4,
        ease: "power2.out"
      }, 0.25);

      // Fade in red wash background glow
      selectTl.to(washWrong, {
        opacity: 1,
        duration: 0.8
      }, 0.25);
    }

    // 3. Display Verdict Overlay details
    verdictOverlay.classList.add('active');

    selectTl.to(verdictOverlay.querySelector('.verdict-glow'), {
      scale: 1.2,
      opacity: 1,
      duration: 1,
      ease: "power4.out"
    }, 0.3);

    selectTl.to(verdictOverlay.querySelector('.verdict-message'), {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power4.out"
    }, 0.4);
  };

  // Event Listeners for Paddle Clicks
  paddleCorrect.addEventListener('click', () => castVerdict('correct'));
  paddleWrong.addEventListener('click', () => castVerdict('wrong'));


  // --- RESET ACTION (JUDGE AGAIN) ---

  btnReset.addEventListener('click', () => {
    if (isTransitioning || !currentVerdict) return;

    isTransitioning = true;
    playSound('reset');
    triggerHaptic(30);

    const resetTl = gsap.timeline({
      onComplete: () => {
        currentVerdict = null;
        isTransitioning = false;
        statusText.innerText = "AWAITING VERDICT...";
        statusText.classList.add('pulse-alpha');
        verdictOverlay.classList.remove('active');

        // Restart float loops
        startIdleFloating();
      }
    });

    // 1. Fade out verdict overlay components
    resetTl.to(verdictOverlay.querySelector('.verdict-message'), {
      opacity: 0,
      y: 30,
      duration: 0.4,
      ease: "power3.in"
    });

    resetTl.to(verdictOverlay.querySelector('.verdict-glow'), {
      scale: 0.2,
      opacity: 0,
      duration: 0.4
    }, 0);

    // Fade color washes
    resetTl.to([washCorrect, washWrong], {
      opacity: 0,
      duration: 0.5
    }, 0);

    // 2. Return selected paddle to its origin
    const activeWrap = currentVerdict === 'correct' ? wrapCorrect : wrapWrong;
    const activePaddle = currentVerdict === 'correct' ? paddleCorrect : paddleWrong;
    const inactiveWrap = currentVerdict === 'correct' ? wrapWrong : wrapCorrect;

    // Reset paddle transformations
    resetTl.to(activeWrap, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: "power3.out"
    }, 0.2);

    resetTl.to(activePaddle, {
      rotate: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.7,
      ease: "power3.out"
    }, 0.2);

    // 3. Slide back in the inactive paddle
    resetTl.fromTo(inactiveWrap,
      { opacity: 0, scale: 0.4, y: 300, rotate: currentVerdict === 'correct' ? -45 : 45 },
      { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.8, ease: "back.out(1)" },
      0.3
    );

    // Restore instructions footer
    resetTl.to(instructionsText, {
      opacity: 0.5,
      y: 0,
      duration: 0.5
    }, 0.4);
  });
});
