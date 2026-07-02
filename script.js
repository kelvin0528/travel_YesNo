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
  const screenUpload = document.getElementById('screen-upload');
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

  // Photo Upload and Display selectors
  const photoInput = document.getElementById('photo-input');
  const uploadCard = document.getElementById('upload-card');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const previewContainer = document.getElementById('preview-container');
  const uploadPreviewImg = document.getElementById('upload-preview-img');
  const uploadActions = document.getElementById('upload-actions');
  const btnShareLink = document.getElementById('btn-share-link');
  const btnShareText = document.getElementById('btn-share-text');
  const btnProceed = document.getElementById('btn-proceed');
  const judgePhoto = document.getElementById('judge-photo');
  const judgePhotoWrapper = document.getElementById('judge-photo-wrapper');
  const btnGotoUpload = document.getElementById('btn-goto-upload');
  const hudButtonsContainer = document.getElementById('hud-buttons-container');

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
      case 'hover': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
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
      } else if (type === 'correct_rain' || type === 'correct') {
        this.isEmoji = type === 'correct_rain' || Math.random() > 0.15;
        if (this.isEmoji) {
          const emojis = ['😋', '😍', '👍', '🎉', '🌟', '❤️', '👏', '🥳', '🙌', '✨', '👌', '👑', '🌈', '🍕', '🍔', '🍦', '🍩', '🍰', '🧁', '🥞', '🍒', '🍓'];
          this.text = emojis[Math.floor(Math.random() * emojis.length)];
          this.fontSize = type === 'correct_rain' ? 16 + Math.random() * 22 : 18 + Math.random() * 24;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotationSpeed = (Math.random() - 0.5) * 0.05;
          
          if (type === 'correct_rain') {
            // Falling down
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = 2 + Math.random() * 4;
            this.decay = 0; // retain full opacity
          } else {
            // Burst upward
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
            const speed = 4 + Math.random() * 8;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.decay = 0; // retain full opacity
          }
        } else {
          // Circular sparkles fallback
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 8;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed - 2;
          this.size = 3 + Math.random() * 4;
          // Cyan-emerald spectrum
          const hue = 130 + Math.random() * 40;
          this.color = `hsla(${hue}, 100%, 65%, `;
        }
      } else if (type === 'wrong_rain' || type === 'wrong') {
        this.isEmoji = type === 'wrong_rain' || Math.random() > 0.15;
        if (this.isEmoji) {
          const emojis = ['🤢', '🤮', '👎', '😡', '🤬', '💩', '💀', '👿', '🙅', '💔', '😭', '💥', '⚠️', '❌', '🚫', '🥀', '🥱', '🗑️', '🤧'];
          this.text = emojis[Math.floor(Math.random() * emojis.length)];
          this.fontSize = type === 'wrong_rain' ? 16 + Math.random() * 22 : 18 + Math.random() * 24;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotationSpeed = (Math.random() - 0.5) * 0.05;

          if (type === 'wrong_rain') {
            // Falling down
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = 2.5 + Math.random() * 4.5;
            this.decay = 0; // retain full opacity
          } else {
            // Burst outward
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 1;
            this.decay = 0; // retain full opacity
          }
        } else {
          // Sharp sparkles fallback
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
    }

    update() {
      if (this.isEmoji) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.vx *= 0.96;
        this.vy *= 0.96;
        
        if (this.type.endsWith('_rain')) {
          this.vy += 0.06; // continuous downward gravitational acceleration for rain
          // Clear when falling past screen bottom
          if (this.y > h + 40 || this.x < -40 || this.x > w + 40) {
            this.alpha = 0;
          }
        } else {
          this.vy -= 0.08; // gentle upwards lift acceleration for burst
          // Clear when floating past screen top
          if (this.y < -40 || this.x < -40 || this.x > w + 40) {
            this.alpha = 0;
          }
        }
      } else {
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
    }

    draw() {
      if (this.isEmoji) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = 1.0; // Force 100% full opacity
        ctx.fillStyle = '#ffffff'; // Reset fillStyle to prevent particle gradient bleed
        ctx.font = `${this.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
      } else {
        ctx.beginPath();
        if (this.type === 'dust') {
          ctx.fillStyle = this.color;
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.type === 'correct') {
          // Glowing circular sparkles
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
  }

  // Pre-fill dust particles
  for (let i = 0; i < 40; i++) {
    particles.push(new Particle(Math.random() * w, Math.random() * h, 'dust'));
  }

  // Explosion triggers
  const spawnExplosion = (x, y, type) => {
    // Reduced count from 80-100 to 18-22 to optimize canvas text rendering speed
    const count = type === 'correct' ? 18 : 22;
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

    // Continuous emoji rain during active verdict (capped to prevent performance lag)
    if (currentVerdict) {
      const activeEmojis = particles.filter(p => p.isEmoji).length;
      if (activeEmojis < 20 && Math.random() < 0.12) {
        particles.push(new Particle(Math.random() * w, -30, currentVerdict + '_rain'));
      }
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

  // --- GAMING BUTTON GSAP INTERACTION ---
  if (btnStart) {
    const tlHover = gsap.timeline({ paused: true });
    
    tlHover.to(btnStart, {
      scale: 1.05,
      backgroundColor: "rgba(25, 21, 14, 0.8)",
      borderColor: "rgba(255, 207, 64, 0.75)",
      boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 207, 64, 0.25)",
      duration: 0.35,
      ease: "power2.out"
    });
    
    tlHover.to(btnStart.querySelector('.btn-bracket.tl'), { top: -6, left: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    tlHover.to(btnStart.querySelector('.btn-bracket.tr'), { top: -6, right: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    tlHover.to(btnStart.querySelector('.btn-bracket.bl'), { bottom: -6, left: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    tlHover.to(btnStart.querySelector('.btn-bracket.br'), { bottom: -6, right: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    
    tlHover.to(btnStart.querySelector('.btn-text'), {
      color: "#ffffff",
      textShadow: "0 0 15px rgba(255, 255, 255, 0.6)",
      letterSpacing: "0.26em",
      duration: 0.35,
      ease: "power2.out"
    }, 0);
    
    tlHover.to(btnStart.querySelector('.btn-subtext'), {
      opacity: 0.95,
      color: "var(--accent-gold)",
      duration: 0.35,
      ease: "power2.out"
    }, 0);
    
    tlHover.to(btnStart.querySelector('.btn-glow'), {
      scale: 1.25,
      opacity: 0.8,
      duration: 0.35,
      ease: "power2.out"
    }, 0);

    btnStart.addEventListener('mouseenter', () => {
      tlHover.play();
      playSound('hover');
      
      // Sheen flash animation on hover
      gsap.fromTo(btnStart.querySelector('.btn-sheen'),
        { left: '-100%' },
        { left: '100%', duration: 0.75, ease: "power2.inOut" }
      );
    });
    
    btnStart.addEventListener('mouseleave', () => {
      tlHover.reverse();
    });
    
    btnStart.addEventListener('mousedown', () => {
      gsap.to(btnStart, { scale: 0.96, duration: 0.1 });
    });
    
    btnStart.addEventListener('mouseup', () => {
      gsap.to(btnStart, { scale: 1.05, duration: 0.2, ease: "power2.out" });
    });
  }

  setup3DTilt(wrapCorrect, paddleCorrect);
  setup3DTilt(wrapWrong, paddleWrong);

  // --- SCREEN TRANSITIONS ---

  // Intro -> Stage directly (checking local storage for persistent photo state)
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

        // Check if there is an existing/persistent photo in localStorage
        const storedPhoto = localStorage.getItem('food_photo');
        if (storedPhoto) {
          if (paddlesArena) {
            paddlesArena.classList.add('has-photo');
          }
          if (judgePhotoWrapper) {
            judgePhotoWrapper.classList.remove('hidden');
          }
          judgePhoto.src = storedPhoto;
        } else {
          if (paddlesArena) {
            paddlesArena.classList.remove('has-photo');
          }
          if (judgePhotoWrapper) {
            judgePhotoWrapper.classList.add('hidden');
          }
        }

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

  // Upload Screen Entry Animation
  const playUploadEntry = () => {
    gsap.set(screenUpload, { opacity: 1 });

    // Reset upload card components to clean, default state
    if (photoInput) {
      photoInput.value = '';
    }
    if (uploadPreviewImg) {
      uploadPreviewImg.src = '';
    }
    if (previewContainer) {
      previewContainer.classList.add('hidden');
    }
    if (uploadPlaceholder) {
      uploadPlaceholder.classList.remove('hidden');
    }
    if (uploadCard) {
      uploadCard.classList.remove('has-preview');
    }
    if (uploadActions) {
      uploadActions.classList.add('hidden');
    }

    gsap.fromTo(screenUpload.querySelector('.upload-content'),
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power4.out" }
    );
  };

  // Stage Entry Animation
  const playStageEntry = () => {
    gsap.set(screenJudge, { opacity: 1 });
    if (paddlesArena) {
      gsap.set(paddlesArena, { opacity: 1, y: 0 });
    }
    if (hudButtonsContainer) {
      gsap.set(hudButtonsContainer, { opacity: 1, y: 0 });
    }

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

    // Animate Polaroid Photo Card
    gsap.fromTo(judgePhotoWrapper,
      { scale: 0.2, rotate: 45, opacity: 0, y: -100 },
      { scale: 1, rotate: -3, opacity: 1, y: 0, duration: 1.1, ease: "back.out(1.3)", delay: 0.1 }
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
      verdictOverlay.className = "verdict-overlay correct-verdict";
    } else {
      verdictTitle.innerText = "TERRIBLE";
      verdictDesc.innerText = "Not quite to the judge's taste. Let's try again!";
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

    selectTl.to(judgePhotoWrapper, {
      opacity: 0,
      scale: 0.5,
      y: 50,
      duration: 0.5,
      ease: "power3.in"
    }, 0);

    selectTl.to(instructionsText, {
      opacity: 0,
      y: 20,
      duration: 0.4
    }, 0);

    selectTl.to(hudButtonsContainer, {
      opacity: 0,
      y: 15,
      duration: 0.4
    }, 0);

    // 2. Animate selected paddle to central screen focus
    // Calculate translation offset to center
    const arenaRect = paddlesArena.getBoundingClientRect();
    const wrapRect = activeWrap.getBoundingClientRect();
    const offsetX = (arenaRect.left + arenaRect.width / 2) - (wrapRect.left + wrapRect.width / 2);
    // Calculate vertical offset dynamically to center of the arena (slightly shifted up to clear bottom message)
    const offsetY = (arenaRect.top + arenaRect.height / 2) - (wrapRect.top + wrapRect.height / 2) - 50;

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


  // --- GAMING RESET BUTTON GSAP INTERACTION ---
  if (btnReset) {
    const tlResetHover = gsap.timeline({ paused: true });
    
    tlResetHover.to(btnReset, {
      scale: 1.05,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.4)",
      boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 255, 255, 0.1)",
      duration: 0.35,
      ease: "power2.out"
    });
    
    tlResetHover.to(btnReset.querySelector('.btn-bracket.tl'), { top: -6, left: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    tlResetHover.to(btnReset.querySelector('.btn-bracket.tr'), { top: -6, right: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    tlResetHover.to(btnReset.querySelector('.btn-bracket.bl'), { bottom: -6, left: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    tlResetHover.to(btnReset.querySelector('.btn-bracket.br'), { bottom: -6, right: -6, width: 12, height: 12, opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
    
    tlResetHover.to(btnReset.querySelector('.btn-text'), {
      textShadow: "0 0 15px rgba(255, 255, 255, 0.6)",
      letterSpacing: "0.26em",
      duration: 0.35,
      ease: "power2.out"
    }, 0);
    
    tlResetHover.to(btnReset.querySelector('.btn-subtext'), {
      opacity: 0.95,
      color: "#ffffff",
      duration: 0.35,
      ease: "power2.out"
    }, 0);
    
    tlResetHover.to(btnReset.querySelector('.btn-glow-soft'), {
      scale: 1.25,
      opacity: 0.8,
      duration: 0.35,
      ease: "power2.out"
    }, 0);

    btnReset.addEventListener('mouseenter', () => {
      tlResetHover.play();
      playSound('hover');
      
      // Sheen flash animation on hover
      gsap.fromTo(btnReset.querySelector('.btn-sheen'),
        { left: '-100%' },
        { left: '100%', duration: 0.75, ease: "power2.inOut" }
      );
    });
    
    btnReset.addEventListener('mouseleave', () => {
      tlResetHover.reverse();
    });
    
    btnReset.addEventListener('mousedown', () => {
      gsap.to(btnReset, { scale: 0.96, duration: 0.1 });
    });
    
    btnReset.addEventListener('mouseup', () => {
      gsap.to(btnReset, { scale: 1.05, duration: 0.2, ease: "power2.out" });
    });
  }


  // --- RESET ACTION (JUDGE AGAIN) ---

  btnReset.addEventListener('click', () => {
    if (isTransitioning || !currentVerdict) return;

    // Clear stored photo and revert paddles back to classic centered layout
    localStorage.removeItem('food_photo');
    if (paddlesArena) {
      paddlesArena.classList.remove('has-photo');
    }

    // Instantly halt rain particles by clearing currentVerdict and filtering particles list
    const tempVerdict = currentVerdict;
    currentVerdict = null;
    particles = particles.filter(p => p.type === 'dust');

    isTransitioning = true;
    playSound('reset');
    triggerHaptic(30);

    const resetTl = gsap.timeline({
      onComplete: () => {
        isTransitioning = false;
        statusText.innerText = "AWAITING VERDICT...";
        statusText.classList.add('pulse-alpha');
        verdictOverlay.classList.remove('active');

        // Hide photo wrapper permanently
        if (judgePhotoWrapper) {
          judgePhotoWrapper.classList.add('hidden');
        }

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
    const activeWrap = tempVerdict === 'correct' ? wrapCorrect : wrapWrong;
    const activePaddle = tempVerdict === 'correct' ? paddleCorrect : paddleWrong;
    const inactiveWrap = tempVerdict === 'correct' ? wrapWrong : wrapCorrect;

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
      { opacity: 0, scale: 0.4, y: 300, rotate: tempVerdict === 'correct' ? -45 : 45 },
      { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.8, ease: "back.out(1)" },
      0.3
    );



    // Restore instructions footer
    resetTl.to(instructionsText, {
      opacity: 0.5,
      y: 0,
      duration: 0.5
    }, 0.4);

    resetTl.fromTo(hudButtonsContainer,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.4
    );
  });

  // --- INTRO ENTRY ANIMATION ---
  const playIntroEntry = () => {
    const tl = gsap.timeline();
    
    // Set initial states
    gsap.set('.intro-badge', { y: 20, opacity: 0 });
    gsap.set('.title-gold', { y: 30, opacity: 0 });
    gsap.set('.title-white', { y: 30, opacity: 0 });
    gsap.set('.intro-divider', { scaleX: 0, opacity: 0 });
    gsap.set('.intro-tagline', { y: 20, opacity: 0 });
    gsap.set('.btn-primary', { y: 30, opacity: 0 });
    
    tl.to('.intro-badge', { y: 0, opacity: 1, duration: 0.8, ease: "power4.out" })
      .to('.title-gold', { y: 0, opacity: 1, duration: 1, ease: "power4.out" }, "-=0.6")
      .to('.title-white', { y: 0, opacity: 1, duration: 1, ease: "power4.out" }, "-=0.8")
      .to('.intro-divider', { scaleX: 1, opacity: 0.6, duration: 0.8, ease: "power2.out" }, "-=0.6")
      .to('.intro-tagline', { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.5")
      .to('.btn-primary', { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.5)" }, "-=0.5");
  };

  // --- IMAGE COMPRESSION UTILITY ---
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to max 350px width/height while maintaining aspect ratio
        const maxDim = 350;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG with 0.6 quality for ultra-compact URL lengths
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        callback(compressedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- PHOTO UPLOAD LOGIC ---
  if (uploadCard && photoInput) {
    uploadCard.addEventListener('click', () => {
      playSound('click');
      photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        playSound('swipe');
        
        compressImage(file, (base64Data) => {
          try {
            localStorage.setItem('food_photo', base64Data);
            
            // Display preview in upload card
            if (uploadCard) {
              uploadCard.classList.add('has-preview');
            }
            uploadPreviewImg.src = base64Data;
            uploadPlaceholder.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            
            // Transition in action buttons using GSAP
            uploadActions.classList.remove('hidden');
            gsap.fromTo(uploadActions,
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
          } catch (err) {
            console.error("Storage error:", err);
          }
        });
      }
    });
  }

  // --- SLEEK BUTTON HOVER GENERATOR ---
  const setupResetBtnHovers = (btn, isPrimary) => {
    if (!btn) return;
    const tl = gsap.timeline({ paused: true });
    tl.to(btn, {
      scale: 1.04,
      backgroundColor: isPrimary ? "rgba(25, 21, 14, 0.8)" : "rgba(255, 255, 255, 0.08)",
      borderColor: isPrimary ? "rgba(255, 207, 64, 0.75)" : "rgba(255, 255, 255, 0.4)",
      boxShadow: isPrimary 
        ? "0 10px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 207, 64, 0.2)"
        : "0 10px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 255, 255, 0.08)",
      duration: 0.3,
      ease: "power2.out"
    });
    tl.to(btn.querySelector('.btn-bracket.tl'), { top: -5, left: -5, width: 10, height: 10, opacity: 1, duration: 0.3 }, 0);
    tl.to(btn.querySelector('.btn-bracket.tr'), { top: -5, right: -5, width: 10, height: 10, opacity: 1, duration: 0.3 }, 0);
    tl.to(btn.querySelector('.btn-bracket.bl'), { bottom: -5, left: -5, width: 10, height: 10, opacity: 1, duration: 0.3 }, 0);
    tl.to(btn.querySelector('.btn-bracket.br'), { bottom: -5, right: -5, width: 10, height: 10, opacity: 1, duration: 0.3 }, 0);

    btn.addEventListener('mouseenter', () => {
      tl.play();
      playSound('hover');
      const sheenEl = btn.querySelector('.btn-sheen');
      if (sheenEl) {
        gsap.fromTo(sheenEl,
          { left: '-100%' },
          { left: '100%', duration: 0.7, ease: "power2.inOut" }
        );
      }
    });
    btn.addEventListener('mouseleave', () => tl.reverse());
    btn.addEventListener('mousedown', () => gsap.to(btn, { scale: 0.96, duration: 0.1 }));
    btn.addEventListener('mouseup', () => gsap.to(btn, { scale: 1.04, duration: 0.2 }));
  };

  // --- SHARE JUDGING LINK ---
  if (btnShareLink) {
    setupResetBtnHovers(btnShareLink, false);
    setupResetBtnHovers(btnProceed, true);

    btnShareLink.addEventListener('click', () => {
      const base64Data = localStorage.getItem('food_photo');
      if (base64Data) {
        // Use a hash parameter (#photo=) so the data is client-side only and never sent to the server (prevents HTTP 431)
        const shareUrl = window.location.origin + window.location.pathname + '#photo=' + encodeURIComponent(base64Data);
        
        navigator.clipboard.writeText(shareUrl).then(() => {
          playSound('correct');
          triggerHaptic([50, 50]);
          
          // Visual feedback on button
          btnShareText.innerText = "COPIED!";
          setTimeout(() => {
            btnShareText.innerText = "SHARE LINK";
          }, 2000);
        }).catch((err) => {
          console.error("Failed to copy URL:", err);
          alert("Could not copy link automatically. Please copy the page URL.");
        });
      }
    });
  }

  // --- PROCEED TO JUDGING ---
  if (btnProceed) {
    btnProceed.addEventListener('click', () => {
      playSound('swipe');
      triggerHaptic(40);
      
      const uploadTl = gsap.timeline({
        onComplete: () => {
          screenUpload.classList.remove('active');
          screenJudge.classList.add('active');
          
          // Load photo from localStorage
          const storedPhoto = localStorage.getItem('food_photo');
          if (storedPhoto) {
            if (paddlesArena) {
              paddlesArena.classList.add('has-photo');
            }
            if (judgePhotoWrapper) {
              judgePhotoWrapper.classList.remove('hidden');
            }
            judgePhoto.src = storedPhoto;
          } else {
            if (paddlesArena) {
              paddlesArena.classList.remove('has-photo');
            }
            if (judgePhotoWrapper) {
              judgePhotoWrapper.classList.add('hidden');
            }
          }
          
          playStageEntry();
        }
      });
      
      uploadTl.to(screenUpload.querySelector('.upload-content'), {
        y: -30,
        opacity: 0,
        duration: 0.5,
        ease: "power3.in"
      });
      uploadTl.to(screenUpload, {
        opacity: 0,
        duration: 0.4
      }, "-=0.2");
    });
  }

  // --- GO TO UPLOAD SCREEN FROM JUDGING HUD ---
  if (btnGotoUpload) {
    setupResetBtnHovers(btnGotoUpload, false);

    btnGotoUpload.addEventListener('click', () => {
      playSound('swipe');
      triggerHaptic(40);
      stopIdleFloating();

      const judgeToUploadTl = gsap.timeline({
        onComplete: () => {
          screenJudge.classList.remove('active');
          screenUpload.classList.add('active');
          playUploadEntry();
        }
      });

      judgeToUploadTl.to(screenJudge.querySelector('.paddles-arena'), {
        y: 40,
        opacity: 0,
        duration: 0.5,
        ease: "power3.in"
      });
      judgeToUploadTl.to(screenJudge, {
        opacity: 0,
        duration: 0.4
      }, "-=0.2");
    });
  }

  // --- CHECK SHARED LINK ON INITIAL LOAD ---
  const checkSharedPhoto = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#photo=')) {
      try {
        const photoParam = decodeURIComponent(hash.substring('#photo='.length));
        localStorage.setItem('food_photo', photoParam);
        
        // Remove base64 data from URL to clean it up
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Transition straight to Stage Screen
        screenIntro.classList.remove('active');
        screenJudge.classList.add('active');
        
        if (paddlesArena) {
          paddlesArena.classList.add('has-photo');
        }
        if (judgePhotoWrapper) {
          judgePhotoWrapper.classList.remove('hidden');
        }
        judgePhoto.src = photoParam;
        
        setTimeout(() => {
          playStageEntry();
        }, 150);
        return true;
      } catch (err) {
        console.error("Error reading shared photo parameter:", err);
      }
    }
    return false;
  };

  const isShared = checkSharedPhoto();
  if (!isShared) {
    playIntroEntry();
  } else {
    gsap.set(screenIntro, { opacity: 0 });
  }
});
