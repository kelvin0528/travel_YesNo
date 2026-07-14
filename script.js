const choiceScreen = document.getElementById('choice-screen');
const resultScreen = document.getElementById('result-screen');
const resultWord = document.getElementById('result-word');
const resetButton = document.getElementById('reset-button');
const emojiRain = document.getElementById('emoji-rain');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const goodEmojis = ['😄', '😍', '👍', '🎉', '✨', '✅', '🥳', '👏'];
const badEmojis = ['😬', '😭', '👎', '💀', '❌', '🤢', '😵', '💔'];
const choiceButtons = window.gsap
  ? gsap.utils.toArray('.choice-button')
  : Array.from(document.querySelectorAll('.choice-button'));

let rainTimer = null;
let rainDelays = [];
let isTransitioning = false;

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(window.ScrollTrigger);
}

const clearEmojiRain = () => {
  window.clearInterval(rainTimer);
  rainTimer = null;
  rainDelays.forEach((delay) => window.clearTimeout(delay));
  rainDelays = [];

  if (window.gsap) {
    gsap.killTweensOf('.emoji-drop');
  }

  emojiRain.replaceChildren();
};

const dropEmoji = (emojis) => {
  const drop = document.createElement('span');
  const size = 1.75 + Math.random() * 2.5;
  const startX = Math.random() * 100;
  const driftX = -80 + Math.random() * 160;
  const duration = 2.6 + Math.random() * 1.8;

  drop.className = 'emoji-drop';
  drop.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  drop.style.left = `${startX}vw`;
  drop.style.fontSize = `${size}rem`;
  emojiRain.append(drop);

  gsap.fromTo(
    drop,
    {
      y: '-12vh',
      x: 0,
      rotation: -35 + Math.random() * 70,
      opacity: 0
    },
    {
      y: '112vh',
      x: driftX,
      rotation: -180 + Math.random() * 360,
      opacity: 1,
      duration,
      ease: 'none',
      onComplete: () => drop.remove()
    }
  );
};

const startEmojiRain = (isYes) => {
  clearEmojiRain();

  if (reduceMotion || !window.gsap) return;

  const emojis = isYes ? goodEmojis : badEmojis;

  for (let i = 0; i < 16; i++) {
    rainDelays.push(window.setTimeout(() => dropEmoji(emojis), i * 65));
  }

  rainTimer = window.setInterval(() => {
    for (let i = 0; i < 3; i++) {
      dropEmoji(emojis);
    }
  }, 260);
};

const initRevealAnimations = () => {
  if (reduceMotion || !window.gsap) return;

  gsap.utils.toArray('[data-reveal]').forEach((element, index) => {
    gsap.fromTo(
      element,
      {
        autoAlpha: 0,
        y: 34,
        scale: 0.96,
        clipPath: 'inset(18% 0 18% 0)'
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        clipPath: 'inset(0% 0 0% 0)',
        duration: 0.85,
        delay: index * 0.08,
        ease: 'power3.out',
        scrollTrigger: window.ScrollTrigger
          ? {
              trigger: element,
              start: 'top 88%',
              once: true
            }
          : null
      }
    );
  });
};

const animateChoiceButtons = () => {
  if (reduceMotion || !window.gsap) return;

  choiceButtons.forEach((button) => {
    const label = button.querySelector('.choice-label');

    button.addEventListener('pointerenter', () => {
      gsap.to(button, {
        scale: 1.015,
        duration: 0.3,
        ease: 'power3.out'
      });
      gsap.to(label, {
        y: -4,
        scale: 1.035,
        duration: 0.3,
        ease: 'power3.out'
      });
    });

    button.addEventListener('pointerleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.35,
        ease: 'power3.out'
      });
      gsap.to(label, {
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: 'power3.out'
      });
    });
  });
};

const playButtonClick = (button, event, onComplete) => {
  if (reduceMotion || !window.gsap) {
    onComplete();
    return;
  }

  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('span');
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  ripple.className = 'button-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  button.append(ripple);

  gsap.timeline({
    onComplete: () => {
      ripple.remove();
      onComplete();
    }
  })
    .to(button, {
      scale: 0.965,
      duration: 0.1,
      ease: 'power2.out'
    }, 0)
    .to(button, {
      scale: 1.02,
      duration: 0.24,
      ease: 'back.out(3)'
    }, 0.1)
    .to(button, {
      scale: 1,
      duration: 0.18,
      ease: 'power3.out'
    }, 0.34)
    .to(ripple, {
      scale: Math.max(rect.width, rect.height) / 6,
      opacity: 0,
      duration: 0.52,
      ease: 'power3.out'
    }, 0);
};

const playResultEntrance = () => {
  if (reduceMotion || !window.gsap) {
    resultScreen.style.clipPath = 'inset(0% 0 0% 0)';
    return;
  }

  gsap.fromTo(
    resultScreen,
    { clipPath: 'inset(100% 0 0 0)' },
    {
      clipPath: 'inset(0% 0 0% 0)',
      duration: 0.72,
      ease: 'power4.inOut'
    }
  );

  gsap.fromTo(
    resultWord,
    {
      autoAlpha: 0,
      y: 28,
      scale: 0.86,
      filter: 'blur(14px)'
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.8,
      delay: 0.2,
      ease: 'back.out(1.8)'
    }
  );

  gsap.fromTo(
    resetButton,
    { autoAlpha: 0, y: -10 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.4,
      delay: 0.42,
      ease: 'power3.out'
    }
  );
};

const showResult = (choice) => {
  const isYes = choice === 'yes';

  choiceScreen.hidden = true;
  resultScreen.hidden = false;
  resultScreen.classList.toggle('is-yes', isYes);
  resultScreen.classList.toggle('is-no', !isYes);
  resultWord.textContent = isYes ? 'YES' : 'NO';
  playResultEntrance();
  startEmojiRain(isYes);
  isTransitioning = false;
};

const reset = () => {
  clearEmojiRain();
  resultScreen.hidden = true;
  resultScreen.classList.remove('is-yes', 'is-no');
  resultWord.textContent = '';
  choiceScreen.hidden = false;
  isTransitioning = false;
};

choiceScreen.addEventListener('click', (event) => {
  const button = event.target.closest('[data-choice]');
  if (!button || isTransitioning) return;

  isTransitioning = true;
  playButtonClick(button, event, () => {
    showResult(button.dataset.choice);
  });
});

resetButton.addEventListener('click', (event) => {
  if (isTransitioning) return;

  isTransitioning = true;
  playButtonClick(resetButton, event, reset);
});

window.addEventListener('keydown', (event) => {
  if (!resultScreen.hidden && event.key === 'Escape') {
    reset();
  }
});

initRevealAnimations();
animateChoiceButtons();
