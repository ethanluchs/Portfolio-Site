// Menu Button Logic
const menuButton = document.getElementById('menuButton');
const menuOverlay = document.getElementById('menuOverlay');

// Toggle menu open/close on button click
menuButton.addEventListener('click', () => {
  menuOverlay.classList.toggle('open');
});

menuOverlay.addEventListener('click', () => {
  if (event.target === menuOverlay) {
    menuOverlay.classList.remove('open');
  }
});

// Scroll Indicator Logic
const scrollIndicator = document.querySelector('.scroll-indicator');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;

  scrollIndicator.style.width = scrollPercent + '%';
});

// Close menu when any link inside menu is clicked
document.querySelectorAll('.menu-links a').forEach(link => {
  link.addEventListener('click', () => {
    menuOverlay.classList.remove('open');
  });
});

// Scroll-triggered animation for fade-in elements
const fadeElements = document.querySelectorAll('.fade-in');

function checkFadeIn() {
  fadeElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) { // 100px before hitting the bottom
      el.classList.add('active');
    }
  });
}

window.addEventListener('scroll', checkFadeIn);

// Initial check in case user reloads while scrolled down
checkFadeIn();

//PROJECTS MARCHING SQUARES - MODIFIED FOR GLOBAL BACKGROUND

//Perlin noise implementation
class SimplexNoise {
  constructor() {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.p[i];
      this.p[i] = this.p[j];
      this.p[j] = temp;
    }
  }

  noise(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const fx = this.fade(x);
    const fy = this.fade(y);
    const fz = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A & 255] + Z;
    const AB = this.p[(A + 1) & 255] + Z;
    const B = this.p[(X + 1) & 255] + Y;
    const BA = this.p[B & 255] + Z;
    const BB = this.p[(B + 1) & 255] + Z;

    return this.lerp(fz,
      this.lerp(fy,
        this.lerp(fx,
          this.grad(this.p[AA & 255], x, y, z),
          this.grad(this.p[BA & 255], x - 1, y, z)),
        this.lerp(fx,
          this.grad(this.p[AB & 255], x, y - 1, z),
          this.grad(this.p[BB & 255], x - 1, y - 1, z))),
      this.lerp(fy,
        this.lerp(fx,
          this.grad(this.p[(AA + 1) & 255], x, y, z - 1),
          this.grad(this.p[(BA + 1) & 255], x - 1, y, z - 1)),
        this.lerp(fx,
          this.grad(this.p[(AB + 1) & 255], x, y - 1, z - 1),
          this.grad(this.p[(BB + 1) & 255], x - 1, y - 1, z - 1))));
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

//BackgroundEffect class is now global
class GlobalBackgroundEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas not found: ${canvasId}`);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.noise = new SimplexNoise();
    this.animationFrame = null;

    this.colors = {
      base: '#5080FF',
      highlight: '#80A0FF',
      accent: '#3060FF'
    };

    window.addEventListener('scroll', () => {
      this.scrollOffset = window.pageYOffset * this.parallaxStrength;
    });

    // Add burstColor property - defaults to accent color
    this.burstColor = this.colors.accent;

    this.isLowPerformanceMode = false;

    // Configuration
    this.config = {
      maxFPS: 10,
      thresholdIncrement: 3,
      thickLineThresholdMultiple: 3,
      resolution: 8,
      baseZOffset: 0.0002
    };

    this.init();
  }

  init() {
    this.zOffset = 0;
    this.mousePos = { x: -99, y: -99 };
    this.mouseDown = false;
    this.colorBursts = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());

    //Always animate since it's a global background
    this.animate();

    //Add mouse event listeners to document body instead of specific section
    document.body.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Only react to mouse movements if they're over the canvas area
      if (e.clientY > rect.top && e.clientY < rect.bottom) {
        this.mousePos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    });

    document.body.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Only react to mouse clicks if they're over the canvas area
      if (e.clientY > rect.top && e.clientY < rect.bottom) {
        this.mouseDown = true;

        const burstX = e.clientX - rect.left;
        const burstY = e.clientY - rect.top;

        // Use the current burstColor instead of a fixed color
        this.colorBursts.push({
          x: burstX,
          y: burstY,
          radius: 0,
          maxRadius: 100,
          intensity: 1,
          color: this.burstColor // Use the dynamic burst color
        });
      }
    });

    document.body.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
  }

  resize() {
    console.log("Resizing canvas");

    // Use window dimensions instead of parent element
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    console.log("New canvas dimensions:", this.canvas.width, this.canvas.height);

    this.cols = Math.floor(this.canvas.width / this.config.resolution) + 1;
    this.rows = Math.floor(this.canvas.height / this.config.resolution) + 1;

    // Initialize arrays
    this.zBoostValues = [];
    this.colorBoostValues = [];
    for (let y = 0; y < this.rows; y++) {
      this.zBoostValues[y] = [];
      this.colorBoostValues[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.zBoostValues[y][x] = 0;
        this.colorBoostValues[y][x] = 0;
      }
    }
  }

  animate() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update z offset
    this.zOffset += this.config.baseZOffset;

    // Update color bursts
    this.updateColorBursts();

    // Apply mouse effects
    if (this.mouseDown) {
      this.mouseOffset();
    }

    // Generate noise
    this.generateNoise();

    // Draw lines
    this.render();

    // Decay color boost values
    this.decayColors();

    // Continue animation
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  // Add a new method to set the burst color
  setBurstColor(color) {
    this.burstColor = color;
  }

  // Modify the existing setLineColor method to optionally update burst color too
  setLineColor(color, updateBurst = true) {
    // Handle both hex and rgb formats
    let hexColor = color;

    // Convert from rgb() format if needed
    if (color.startsWith('rgb')) {
      const rgbValues = color.match(/\d+/g);
      if (rgbValues && rgbValues.length >= 3) {
        const [r, g, b] = rgbValues;
        hexColor = '#' + ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1);
      }
    }

    // Set the colors
    this.colors.base = hexColor;

    // Generate a slightly lighter version for highlight
    const lighterColor = this.lightenColor(hexColor, 20);
    this.colors.highlight = lighterColor;

    // When the line color changes, update the burst color too if requested
    if (updateBurst) {
      this.burstColor = hexColor;
    }
  }

  // Helper method to create a lighter version of a color
  lightenColor(color, percent) {
    // Convert hex to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);

    // Lighten
    r = Math.min(255, Math.floor(r * (1 + percent / 100)));
    g = Math.min(255, Math.floor(g * (1 + percent / 100)));
    b = Math.min(255, Math.floor(b * (1 + percent / 100)));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  updateColorBursts() {
    for (let i = this.colorBursts.length - 1; i >= 0; i--) {
      const burst = this.colorBursts[i];
      burst.radius += 3;
      burst.intensity *= 0.98;

      if (burst.intensity < 0.01) {
        this.colorBursts.splice(i, 1);
      } else {
        // Apply color burst to nearby cells
        const cellX = Math.floor(burst.x / this.config.resolution);
        const cellY = Math.floor(burst.y / this.config.resolution);
        const cellRadius = Math.floor(burst.radius / this.config.resolution);

        for (let dy = -cellRadius; dy <= cellRadius; dy++) {
          for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            const x = cellX + dx;
            const y = cellY + dy;
            if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= cellRadius) {
                this.colorBoostValues[y][x] += burst.intensity * (1 - dist / cellRadius);
              }
            }
          }
        }
      }
    }
  }

  mouseOffset() {
    const x = Math.floor(this.mousePos.x / this.config.resolution);
    const y = Math.floor(this.mousePos.y / this.config.resolution);

    if (!this.inputValues[y] || this.inputValues[y][x] === undefined) return;

    const incrementValue = 0.0025;
    const radius = 5;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const distanceSquared = i * i + j * j;
        const radiusSquared = radius * radius;

        if (distanceSquared <= radiusSquared &&
          this.zBoostValues[y + i] &&
          this.zBoostValues[y + i][x + j] !== undefined) {
          this.zBoostValues[y + i][x + j] += incrementValue * (1 - distanceSquared / radiusSquared);
          this.colorBoostValues[y + i][x + j] += 0.1 * (1 - distanceSquared / radiusSquared);
        }
      }
    }
  }

  generateNoise() {
    this.inputValues = [];
    this.noiseMin = 100;
    this.noiseMax = 0;

    for (let y = 0; y < this.rows; y++) {
      this.inputValues[y] = [];
      for (let x = 0; x < this.cols; x++) {
        const noiseValue = this.noise.noise(
          x * 0.02,
          y * 0.02,
          this.zOffset + (this.zBoostValues[y][x] || 0)
        ) * 100;

        this.inputValues[y][x] = noiseValue;

        if (noiseValue < this.noiseMin) this.noiseMin = noiseValue;
        if (noiseValue > this.noiseMax) this.noiseMax = noiseValue;

        if (this.zBoostValues[y][x] > 0) {
          this.zBoostValues[y][x] *= 0.99;
        }
      }
    }
  }

  getLineColor(x, y) {
    const colorBoost = this.colorBoostValues[y] && this.colorBoostValues[y][x] ? this.colorBoostValues[y][x] : 0;

    // Interpolate between base and highlight color based on boost
    const baseColor = this.colors.base;
    // Use burstColor (which matches the section) for intense highlights
    const highlightColor = colorBoost > 0.3 ? this.burstColor : this.colors.highlight;

    // Parse hex colors
    const base = parseInt(baseColor.slice(1), 16);
    const highlight = parseInt(highlightColor.slice(1), 16);

    const baseR = (base >> 16) & 255;
    const baseG = (base >> 8) & 255;
    const baseB = base & 255;

    const highlightR = (highlight >> 16) & 255;
    const highlightG = (highlight >> 8) & 255;
    const highlightB = highlight & 255;

    // Interpolate
    const t = Math.min(colorBoost * 2, 1);
    const r = Math.round(baseR + (highlightR - baseR) * t);
    const g = Math.round(baseG + (highlightG - baseG) * t);
    const b = Math.round(baseB + (highlightB - baseB) * t);

    // Add alpha based on color boost
    const alpha = Math.min(0.40 + colorBoost * 0.7, 1);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  render() {
    const roundedNoiseMin = Math.floor(this.noiseMin / this.config.thresholdIncrement) * this.config.thresholdIncrement;
    const roundedNoiseMax = Math.ceil(this.noiseMax / this.config.thresholdIncrement) * this.config.thresholdIncrement;

    for (let threshold = roundedNoiseMin; threshold < roundedNoiseMax; threshold += this.config.thresholdIncrement) {
      this.currentThreshold = threshold;
      this.renderAtThreshold();
    }
  }

  renderAtThreshold() {
    for (let y = 0; y < this.inputValues.length - 1; y++) {
      for (let x = 0; x < this.inputValues[y].length - 1; x++) {
        // Check if we need to draw anything in this cell
        const nw = this.inputValues[y][x];
        const ne = this.inputValues[y][x + 1];
        const se = this.inputValues[y + 1][x + 1];
        const sw = this.inputValues[y + 1][x];

        // Skip if all corners are on the same side of threshold
        if ((nw > this.currentThreshold && ne > this.currentThreshold && se > this.currentThreshold && sw > this.currentThreshold) ||
          (nw < this.currentThreshold && ne < this.currentThreshold && se < this.currentThreshold && sw < this.currentThreshold)) {
          continue;
        }

        const gridValue = this.binaryToType(
          nw > this.currentThreshold ? 1 : 0,
          ne > this.currentThreshold ? 1 : 0,
          se > this.currentThreshold ? 1 : 0,
          sw > this.currentThreshold ? 1 : 0
        );

        // Set color for this cell based on position
        this.ctx.strokeStyle = this.getLineColor(x, y);
        this.ctx.lineWidth = this.currentThreshold % (this.config.thresholdIncrement * this.config.thickLineThresholdMultiple) === 0 ? 4 : 1;

        this.ctx.beginPath();
        this.placeLines(gridValue, x, y);
        this.ctx.stroke();
      }
    }
  }

  placeLines(gridValue, x, y) {
    const nw = this.inputValues[y][x];
    const ne = this.inputValues[y][x + 1];
    const se = this.inputValues[y + 1][x + 1];
    const sw = this.inputValues[y + 1][x];

    switch (gridValue) {
      case 1:
      case 14:
        this.line(
          [x * this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(nw, sw)],
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(sw, se), y * this.config.resolution + this.config.resolution]
        );
        break;
      case 2:
      case 13:
        this.line(
          [x * this.config.resolution + this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(ne, se)],
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(sw, se), y * this.config.resolution + this.config.resolution]
        );
        break;
      case 3:
      case 12:
        this.line(
          [x * this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(nw, sw)],
          [x * this.config.resolution + this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(ne, se)]
        );
        break;
      case 4:
      case 11:
        this.line(
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(nw, ne), y * this.config.resolution],
          [x * this.config.resolution + this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(ne, se)]
        );
        break;
      case 5:
        this.line(
          [x * this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(nw, sw)],
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(nw, ne), y * this.config.resolution]
        );
        this.line(
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(sw, se), y * this.config.resolution + this.config.resolution],
          [x * this.config.resolution + this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(ne, se)]
        );
        break;
      case 6:
      case 9:
        this.line(
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(nw, ne), y * this.config.resolution],
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(sw, se), y * this.config.resolution + this.config.resolution]
        );
        break;
      case 7:
      case 8:
        this.line(
          [x * this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(nw, sw)],
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(nw, ne), y * this.config.resolution]
        );
        break;
      case 10:
        this.line(
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(nw, ne), y * this.config.resolution],
          [x * this.config.resolution + this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(ne, se)]
        );
        this.line(
          [x * this.config.resolution, y * this.config.resolution + this.config.resolution * this.linInterpolate(nw, sw)],
          [x * this.config.resolution + this.config.resolution * this.linInterpolate(sw, se), y * this.config.resolution + this.config.resolution]
        );
        break;
    }
  }

  line(from, to) {
    this.ctx.moveTo(from[0], from[1]);
    this.ctx.lineTo(to[0], to[1]);
  }

  linInterpolate(x0, x1, y0 = 0, y1 = 1) {
    if (x0 === x1) {
      return 0;
    }
    return y0 + ((y1 - y0) * (this.currentThreshold - x0)) / (x1 - x0);
  }

  binaryToType(nw, ne, se, sw) {
    return (nw << 3) | (ne << 2) | (se << 1) | sw;
  }

  decayColors() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.colorBoostValues[y][x] *= 0.95;
      }
    }
  }
}

// Helper functions for color animation
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  let r, g, b;
  if (hex.length === 3) {
    // Short notation (e.g. #ABC)
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    // Full notation (e.g. #AABBCC)
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  return { r, g, b };
}

function rgbToHex(rgb) {
  return '#' +
    ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b)
      .toString(16)
      .slice(1);
}

function interpolateColor(color1, color2, factor) {
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;

  const result = {
    r: Math.round(rgb1.r + factor * (rgb2.r - rgb1.r)),
    g: Math.round(rgb1.g + factor * (rgb2.g - rgb1.g)),
    b: Math.round(rgb1.b + factor * (rgb2.b - rgb1.b))
  };

  return result;
}

function setupSectionColorObserver() {
  const observerOptions = {
    threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.9],
    rootMargin: '-10% 0px -10% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    // Find the section with the highest intersection ratio (most visible)
    let mostVisibleEntry = null;
    let highestRatio = 0;

    // Check ALL entries, not just intersecting ones
    entries.forEach(entry => {
      if (entry.intersectionRatio > highestRatio) {
        highestRatio = entry.intersectionRatio;
        mostVisibleEntry = entry;
      }
    });

    // Only proceed if we have a clearly visible section
    if (mostVisibleEntry && highestRatio > 0.3) {
      const newColor = mostVisibleEntry.target.getAttribute('data-section-color');

      if (newColor && window.backgroundEffectInstance) {
        // Get the current color before starting transition
        const currentColor = window.backgroundEffectInstance.colors.base;

        // Only animate if the color is actually different
        if (currentColor !== newColor) {
          console.log('Changing background color to:', newColor);

          // Setup animation with anime.js
          anime({
            duration: 1000,
            easing: 'easeInOutCubic',
            update: function (anim) {
              const progress = anim.progress / 100;
              const rgbColor = interpolateColor(currentColor, newColor, progress);
              const hexColor = rgbToHex(rgbColor);

              window.backgroundEffectInstance.setLineColor(hexColor);
              window.backgroundEffectInstance.setBurstColor(hexColor);
            }
          });
        }
      }
    }
  }, observerOptions);

  // Wait a moment for DOM to be fully ready, then set up observers
  setTimeout(() => {
    // Observe the actual section containers with their colors
    const sectionsToObserve = [
      { selector: '#projects', color: '#5C6AC4' },
      { selector: '#skills', color: '#00ff88' },
      { selector: '#about', color: '#C547F6' }
    ];

    sectionsToObserve.forEach(section => {
      const element = document.querySelector(section.selector);
      if (element) {
        console.log('Setting up observer for:', section.selector, 'with color:', section.color);
        element.setAttribute('data-section-color', section.color);
        observer.observe(element);
      }
    });

    // Not used anymore removed hero section
    const heroSection = document.querySelector('.hero-wrapper');
    if (heroSection) {
      heroSection.setAttribute('data-section-color', '#5080FF');

      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // More sensitive detection for hero section
          if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
            const defaultColor = '#5080FF';
            console.log('Hero section visible, changing to default color:', defaultColor);

            if (window.backgroundEffectInstance) {
              const currentColor = window.backgroundEffectInstance.colors.base;
              if (currentColor !== defaultColor) {
                anime({
                  duration: 800,
                  easing: 'easeInOutCubic',
                  update: function (anim) {
                    const progress = anim.progress / 100;
                    const rgbColor = interpolateColor(currentColor, defaultColor, progress);
                    const hexColor = rgbToHex(rgbColor);

                    window.backgroundEffectInstance.setLineColor(hexColor);
                    window.backgroundEffectInstance.setBurstColor(hexColor);
                  }
                });
              }
            }
          }
        });
      }, {
        threshold: [0.1, 0.2, 0.3, 0.5],
        rootMargin: '0px 0px -10% 0px'
      });

      heroObserver.observe(heroSection);

      // ALSO observe with the main observer
      observer.observe(heroSection);
    }
  }, 100);
}

// Project Filter Class
class ProjectFilter {
  constructor() {
    this.projects = document.querySelectorAll('.project-card');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.projectCount = document.getElementById('projectCount');
    this.currentFilter = 'all';

    this.init();
  }

  init() {
    console.log('ProjectFilter initialized with', this.projects.length, 'projects');
    console.log('Filter buttons found:', this.filterButtons.length);

    // Add click event listeners to filter buttons
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        console.log('Filter button clicked:', e.target.getAttribute('data-filter'));
        const filter = e.target.getAttribute('data-filter');
        this.filterProjects(filter);
      });
    });

    // Initial count
    this.updateProjectCount();
  }

  filterProjects(filter) {
    console.log('Filtering projects by:', filter);

    // Don't do anything if same filter is clicked
    if (filter === this.currentFilter) return;

    this.currentFilter = filter;

    // Update active button
    this.filterButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-filter') === filter) {
        btn.classList.add('active');
      }
    });

    // Determine which projects should be visible after filtering
    const projectsToShow = [];

    this.projects.forEach((project) => {
      const categories = project.getAttribute('data-categories');
      if (!categories) {
        console.warn('Project missing data-categories attribute:', project);
        return;
      }

      const categoriesArray = categories.split(',');
      let shouldShow = false;

      switch (filter) {
        case 'all':
          shouldShow = true;
          break;
        case 'development':
          shouldShow = categoriesArray.includes('development') && !categoriesArray.includes('design');
          break;
        case 'design':
          shouldShow = categoriesArray.includes('design') && !categoriesArray.includes('development');
          break;
        case 'both':
          shouldShow = categoriesArray.includes('development') && categoriesArray.includes('design');
          break;
      }

      if (shouldShow) {
        projectsToShow.push(project);
      }
    });

    console.log('Projects to show after filter:', projectsToShow.length);

    // Phase 1: Animate out ALL projects simultaneously
    const allProjects = Array.from(this.projects);

    anime({
      targets: allProjects,
      opacity: 0,
      scale: 0.85,
      translateY: -20,
      duration: 400,
      delay: anime.stagger(40, { start: 0 }),
      easing: 'easeInQuart',
      complete: () => {
        // Phase 2: Hide all projects and prepare for show animation
        allProjects.forEach(project => {
          project.style.display = 'none';
          project.classList.add('filtered-out');
          project.classList.remove('filtered-in');
        });

        // Phase 3: Show and animate in only the projects that should be visible
        projectsToShow.forEach((project) => {
          project.style.display = 'block';
          project.classList.remove('filtered-out');
          project.classList.add('animating-in');

          // Set initial state for animation
          anime.set(project, {
            opacity: 0,
            scale: 0.85,
            translateY: 30
          });
        });

        // Phase 4: Animate in the visible projects with a nice stagger
        anime({
          targets: projectsToShow,
          opacity: 1,
          scale: 1,
          translateY: 0,
          duration: 500,
          delay: anime.stagger(100, { start: 200 }),
          easing: 'easeOutCubic',
          complete: () => {
            // Clean up animation classes
            projectsToShow.forEach(project => {
              project.classList.remove('animating-in');
              project.classList.add('filtered-in');
            });
          }
        });

        // Update project count after a short delay
        setTimeout(() => {
          this.updateProjectCount();
        }, 400);
      }
    });

    // Analytics tracking (if you implement it later)
    this.trackFilterUsage(filter);
  }

  updateProjectCount() {
    const visibleProjects = Array.from(this.projects).filter(project => {
      return !project.classList.contains('filtered-out');
    });

    if (this.projectCount) {
      this.projectCount.textContent = visibleProjects.length;

      // Animate the count change
      anime({
        targets: this.projectCount.parentElement,
        scale: [1, 1.1, 1],
        duration: 400,
        easing: 'easeOutQuart'
      });
    }
  }

  trackFilterUsage(filter) {
    //for later
    console.log(`Filter used: ${filter}`);
  }
}



// CONSOLIDATED DOMContentLoaded EVENT LISTENER
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');

  // Initialize the marching squares background for the entire page
  window.backgroundEffectInstance = new GlobalBackgroundEffect('marching-squares-canvas');
  window.backgroundEffectInstance.setLineColor('#C547F6');
  window.backgroundEffectInstance.setBurstColor('#C547F6');

  // Set up the smooth color transition observer
  setupSectionColorObserver();
  new SectionNavigationDots();

  // Initialize the PROJECT FILTER SYSTEM
  const projectFilter = new ProjectFilter();

  // Skills tabs functionality
  const tabs = document.querySelectorAll('.skill-tab');
  const cards = document.querySelectorAll('.skill-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selected = tab.getAttribute('data-skill');

      // Highlight selected tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show matching card
      cards.forEach(card => {
        if (card.getAttribute('data-skill-card') === selected) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    });
  });

  // Default tab
  if (tabs.length > 0) {
    tabs[0].click();
  }

  // Section header animations
  const sectionHeaders = document.querySelectorAll('.section-title.fade-in');

  if (sectionHeaders.length > 0) {
    console.log('Found section headers:', sectionHeaders.length);

    // Create Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('Section header visible, starting animation:', entry.target.id);

          // Fade in with slight upward movement
          anime({
            targets: entry.target,
            opacity: [0, 1],
            translateY: [150, 0],
            translateX: [-150, 0],
            scale: [0.5, 1.1, 1],
            rotate: ['-90deg', '0deg'],
            duration: 2000,
            easing: 'easeOutElastic(1, .8)',
          });

          // Disconnect observer for this specific header so animation only plays once
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Setup initial state for each header
    sectionHeaders.forEach(header => {
      // Initialize styles (hidden initially)
      header.style.opacity = '0';
      header.style.transform = 'translateY(30px)';

      // Start observing
      observer.observe(header);
    });
  }

  // Add entrance animations for filter buttons
  anime({
    targets: '.filter-btn',
    opacity: [0, 1],
    translateY: [-20, 0],
    duration: 600,
    delay: anime.stagger(100, { start: 200 }),
    easing: 'easeOutQuart'
  });

  // Add hover effects to filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      if (!button.classList.contains('active')) {
        anime({
          targets: button,
          scale: 1.05,
          duration: 200,
          easing: 'easeOutQuart'
        });
      }
    });

    button.addEventListener('mouseleave', () => {
      if (!button.classList.contains('active')) {
        anime({
          targets: button,
          scale: 1,
          duration: 200,
          easing: 'easeOutQuart'
        });
      }
    });
  });

  // Skills Section Animation
  const skillTabs = document.querySelectorAll('.skill-tab');
  const skillCards = document.querySelectorAll('.skill-card');
  let currentCard = null;
  let isAnimating = false;

  // Initialize - show first card by default
  if (skillCards.length > 0) {
    // Hide all cards initially
    skillCards.forEach(card => {
      card.style.display = 'none';
      card.classList.remove('active');
    });

    // Show and animate first card
    skillCards[0].classList.add('active');
    skillTabs[0].classList.add('active');
    currentCard = skillCards[0];
    animateCardIn(skillCards[0], true); // true = initial load
  }

  // Animate card entrance
  function animateCardIn(card, isInitial = false) {
    // Ensure the card container maintains its height
    const skillCardsContainer = document.querySelector('.skill-cards');
    if (!isInitial && skillCardsContainer) {
      skillCardsContainer.style.minHeight = skillCardsContainer.offsetHeight + 'px';
    }

    // Set initial state
    anime.set(card, {
      opacity: 0,
      translateY: 30,
      scale: 0.95,
      display: 'flex' // Set display immediately
    });

    // Animate the card in
    anime({
      targets: card,
      opacity: 1,
      translateY: 0,
      scale: 1,
      duration: 600,
      easing: 'easeOutQuart',
      complete: function () {
        // Reset container height after animation
        if (!isInitial && skillCardsContainer) {
          skillCardsContainer.style.minHeight = '';
        }
        isAnimating = false;
      }
    });

    // Animate skill rows with stagger
    const skillRows = card.querySelectorAll('.skill-row');
    anime.set(skillRows, {
      opacity: 0,
      translateX: -20
    });

    anime({
      targets: skillRows,
      opacity: 1,
      translateX: 0,
      duration: 400,
      delay: anime.stagger(100, { start: 200 }),
      easing: 'easeOutQuart'
    });

    // Animate level dots with stagger
    const levelDots = card.querySelectorAll('.level div');
    anime.set(levelDots, {
      scale: 0,
      opacity: 0
    });

    anime({
      targets: levelDots,
      scale: 1,
      opacity: 1,
      duration: 300,
      delay: anime.stagger(50, { start: 400 }),
      easing: 'easeOutBack'
    });
  }

  // Animate card exit
  function animateCardOut(card) {
    return new Promise((resolve) => {
      anime({
        targets: card,
        opacity: 0,
        translateY: -20,
        scale: 0.98,
        duration: 300,
        easing: 'easeInQuart',
        complete: function () {
          card.style.display = 'none';
          card.classList.remove('active');
          resolve();
        }
      });
    });
  }

  // Handle tab clicks
  skillTabs.forEach((tab, index) => {
    tab.addEventListener('click', async function () {
      // Prevent multiple animations at once
      if (isAnimating) return;

      const targetSkill = tab.getAttribute('data-skill');
      const targetCard = document.querySelector(`[data-skill-card="${targetSkill}"]`);

      if (targetCard && targetCard !== currentCard) {
        isAnimating = true;

        // Remove active state from all tabs
        skillTabs.forEach(t => t.classList.remove('active'));

        // Add active state to clicked tab
        tab.classList.add('active');

        // First, animate out current card completely
        if (currentCard) {
          await animateCardOut(currentCard);
        }

        // Then animate in new card
        targetCard.classList.add('active');
        animateCardIn(targetCard);
        currentCard = targetCard;
      }
    });
  });

  // About section entrance animation
  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateAboutEntrance();
        aboutObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.3
  });

  const aboutSection = document.querySelector('.about-section');
  if (aboutSection) {
    // Hide elements initially
    anime.set('.personal-photo, .my-title, .my-title2, .tag .item, .link-row a', {
      opacity: 0
    });

    aboutObserver.observe(aboutSection);
  }

  function animateAboutEntrance() {
    const photo = document.querySelector('.personal-photo');
    const titles = document.querySelectorAll('.my-title, .my-title2');
    const tagItems = document.querySelectorAll('.tag .item');
    const linkItems = document.querySelectorAll('.link-row a');

    // Set initial states
    anime.set(photo, {
      opacity: 0,
      translateX: -50,
      scale: 0.9
    });

    anime.set(titles, {
      opacity: 0,
      translateX: 30
    });

    anime.set(tagItems, {
      opacity: 0,
      translateY: 20,
      scale: 0.95
    });

    anime.set(linkItems, {
      opacity: 0,
      translateY: 15,
      scale: 0.9
    });

    // Animate photo with slide and scale
    anime({
      targets: photo,
      opacity: [0, 1],
      translateX: [-50, 0],
      scale: [0.9, 1],
      duration: 800,
      easing: 'easeOutExpo',
      delay: 100
    });

    // Animate titles sliding from right
    anime({
      targets: titles,
      opacity: [0, 1],
      translateX: [30, 0],
      duration: 600,
      delay: anime.stagger(150, { start: 300 }),
      easing: 'easeOutQuart'
    });

    // Animate tag items with staggered bounce
    anime({
      targets: tagItems,
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.95, 1],
      duration: 500,
      delay: anime.stagger(100, { start: 700 }),
      easing: 'easeOutBack'
    });

    // Animate links with bounce effect
    anime({
      targets: linkItems,
      opacity: [0, 1],
      translateY: [15, 0],
      scale: [0.9, 1],
      duration: 400,
      delay: anime.stagger(80, { start: 1200 }),
      easing: 'easeOutExpo'
    });
  }

  // Hero section video handling
  const video = document.getElementById('heroVideo');
  const heroIntro = document.getElementById('heroIntro');
  const menuButton = document.getElementById('menuButton');

  if (video && heroIntro && menuButton) {
    // Show everything immediately
    anime.set(menuButton, { opacity: 1 });
    heroIntro.classList.add('active');

    // Just handle video looping
    video.addEventListener('ended', () => {
      video.classList.add('blurred');
      video.loop = true;
      video.play();
    });
  }
});

// Additional responsive handling
function handleSkillsResize() {
  const skillSection = document.querySelector('.skill-section');
  const skillCards = document.querySelectorAll('.skill-card');

  if (window.innerWidth <= 768) {
    skillCards.forEach(card => {
      card.style.width = '100%';
      card.style.maxWidth = '100%';
      card.style.minHeight = 'auto';
    });
  } else if (window.innerWidth <= 1024) {
    skillCards.forEach(card => {
      card.style.width = '90%';
      card.style.maxWidth = '600px';
    });
  } else {
    skillCards.forEach(card => {
      card.style.width = '700px';
      card.style.maxWidth = '700px';
      card.style.minHeight = '420px';
    });
  }
}

//Section Navigation Dots Class

class SectionNavigationDots {
  constructor() {
    this.dots = document.querySelectorAll('.nav-dot');
    this.sections = document.querySelectorAll('.section, .hero-wrapper');
    this.currentSection = null;

    this.init();
  }

  init() {
    // Add click handlers to dots
    this.dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const sectionId = dot.getAttribute('data-section');
        this.navigateToSection(sectionId);
      });
    });

    // Set up intersection observer for scroll detection
    this.setupScrollObserver();

    // Initial check for active section
    this.updateActiveDot();
  }

  navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  setupScrollObserver() {
    const observerOptions = {
      threshold: [0.3, 0.6],
      rootMargin: '-10% 0px -10% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      let mostVisibleEntry = null;
      let highestRatio = 0;

      entries.forEach(entry => {
        if (entry.intersectionRatio > highestRatio) {
          highestRatio = entry.intersectionRatio;
          mostVisibleEntry = entry;
        }
      });

      if (mostVisibleEntry && highestRatio > 0.3) {
        const sectionId = mostVisibleEntry.target.id;
        this.setActiveSection(sectionId);
      }
    }, observerOptions);

    // Observe all your sections
    this.sections.forEach(section => {
      observer.observe(section);
    });
  }

  setActiveSection(sectionId) {
    if (this.currentSection === sectionId) return;

    this.currentSection = sectionId;
    this.updateActiveDot();

    // Update your existing background color system
    this.updateBackgroundColor(sectionId);
  }

  updateActiveDot() {
    // Remove active class from all dots
    this.dots.forEach(dot => {
      dot.classList.remove('active');
    });

    // Add active class to current section's dot
    if (this.currentSection) {
      const activeDot = document.querySelector(`[data-section="${this.currentSection}"]`);
      if (activeDot) {
        activeDot.classList.add('active');
      }
    }
  }

  updateBackgroundColor(sectionId) {
    // Integration with your existing marching squares background
    if (window.backgroundEffectInstance) {
      let newColor;

      switch (sectionId) {
        case 'projects':
          newColor = '#5C6AC4';
          break;
        case 'skills':
          newColor = '#00ff88';
          break;
        case 'about':
          newColor = '#C547F6';
          break;
        default:
          newColor = '#5080FF'; // Default/hero color
      }

      const currentColor = window.backgroundEffectInstance.colors.base;

      if (currentColor !== newColor && window.anime) {
        anime({
          duration: 1000,
          easing: 'easeInOutCubic',
          update: function (anim) {
            const progress = anim.progress / 100;
            const rgbColor = interpolateColor(currentColor, newColor, progress);
            const hexColor = rgbToHex(rgbColor);

            window.backgroundEffectInstance.setLineColor(hexColor);
            window.backgroundEffectInstance.setBurstColor(hexColor);
          }
        });
      }
    }
  }
}


window.addEventListener('resize', handleSkillsResize);
window.addEventListener('load', handleSkillsResize);

function scrollToProjects() {
  document.getElementById('projects').scrollIntoView({
    behavior: 'smooth'
  });
}

// Project data
const projectData = {
  greenview: {
    title: "GreenView",
    overview: "GreenView is the result of a semester-long UX-only group project created to improve the experience of visitors at Virginia Tech's Hahn Horticulture Garden. The app enables users to identify plants using AR, navigate the garden using an interactive map, and record personal observations through a journaling feature.",
    role: "UX Researcher & Lead Designer",
    timeline: "January - May 2025",
    team: "4 members (Led Phases 1-3)",
    features: [
      "Visual plant identification interface (AR)",
      "Interactive Garden Map",
      "Layered information display",
      "Favorites and observation journal",
      "Location-based content indicators"
    ],
    tech: ["Figma", "Prototyping", "User Research", "Wireframing", "Heuristic Evaluation"],
    phases: [
      {
        number: 1,
        subtitle: "Phase 1",
        title: "Contextual Inquiry & Research",
        description: "Led comprehensive field research including direct observation, semi-structured user interviews, and competitive analysis of plant ID apps like Seek. Used affinity diagramming and task modeling techniques to synthesize findings into actionable user needs and system requirements.",
        outputs: {
          title: "Key Contributions",
          content: "<strong>Site Research:</strong> Led site observations and photo documentation<br><strong>User Insights:</strong> Designed and conducted user interviews<br><strong>Analysis:</strong> Created Work Activity Affinity Diagram (WAAD)<br><strong>Personas:</strong> Developed three core personas: Student, Academic, Hobbyist<br><strong>Requirements:</strong> Defined five key system requirements"
        }
      },
      {
        number: 2,
        subtitle: "Phase 2",
        title: "Design Ideation & Storyboarding",
        description: "Generated 100+ feature ideas through collaborative ideation and critique sessions. Organized ideas into functional categories and developed design-informing models (DIMs) including hierarchical task breakdowns and step-by-step task flows that informed wireframe structure.",
        outputs: {
          title: "Key Deliverables",
          content: "<strong>Models:</strong> Task models and design-informing models (DIMs)<br><strong>Wireframes:</strong> Low-fidelity wireframes for core app features<br><strong>Concepts:</strong> Conceptual metaphors: \"guided tour\" and \"garden journal\"<br><strong>Strategy:</strong> UX goals grounded in user behaviors and frustrations"
        }
      },
      {
        number: 3,
        subtitle: "Phase 3",
        title: "Prototyping & UX Strategy",
        description: "Created a high-fidelity, interactive prototype in Figma focusing on the critical user path: navigating from home screen to plant scanning and journal saving. Design emphasized accessibility and clarity for outdoor environment use, with visual cues optimized for bright lighting conditions.",
        outputs: {
          title: "Highlights",
          content: "<strong>Prototype:</strong> Depth-first Figma prototype with interactive walkthrough<br><strong>AR Interface:</strong> Camera interface with AR overlay and success feedback<br><strong>Information Design:</strong> Layered information display for casual and in-depth learning<br><strong>Interactions:</strong> Microinteractions aligned with key user goals"
        }
      },
      {
        number: 4,
        subtitle: "Phase 4",
        title: "Evaluation & Testing",
        description: "While teammates led this phase, I contributed foundational materials that framed the heuristic evaluation process. The team used Nielsen's heuristics to guide expert evaluations, identifying usability concerns and validating design decisions through structured testing protocols.",
        outputs: {
          title: "Results",
          content: "<strong>Usability:</strong> Zero critical usability issues identified<br><strong>Success Rate:</strong> 85% task completion rate in testing<br><strong>Accessibility:</strong> Positive feedback on outdoor accessibility features<br><strong>Validation:</strong> Design decisions confirmed through expert evaluation"
        }
      }
    ],
    primaryAction: {
      text: "View Prototype",
      url: "https://www.figma.com/proto/DVFHHJyTZrT1Gw7t8D4LI9/Untitled?node-id=0-1&t=nBWwoZK4qb00HORA-1"
    },
    secondaryAction: {
      text: "Download Report",
      url: "#"
    }
  },
  pomodoro: {
    title: "Pomodoro Study Timer",
    overview: "Full-stack study timer application implementing the Pomodoro Technique with 25/5/15 minute work/break intervals. Built with React and deployed on Azure Static Web Apps, featuring a custom animated background and responsive design optimized for both mobile and desktop use.",
    role: "Designer & Developer",
    timeline: "March 2025",
    team: "Personal Project",
    features: [
      "Timer display with MM:SS format",
      "Three timer modes: Pomodoro (25min), Short Break (5min), Long Break (15min)",
      "Session progress tracking",
      "Visual state indicators for active/inactive states",
      "Custom animated blob background"
    ],
    tech: ["React", "HTML/CSS", "JavaScript", "Figma", "Azure", "Webpack"],
    phases: [
      {
        number: 1,
        subtitle: "Phase 1",
        title: "Motivation & Research",
        description: "Developed this project to gain hands-on experience with Figma design workflows and React development while creating a personal productivity tool. Analyzed existing pomodoro apps for inspiration and drew from extensive personal experience using pomodoro timers.",
        outputs: {
          title: "Key Insights",
          content: "<strong>Reference:</strong> Analyzed pomofocus.io for core functionality and UX patterns<br><strong>Personal Use:</strong> Drew from extensive experience using pomodoro timers<br><strong>Design Inspiration:</strong> FIFA 22 home page aesthetic for visual design language<br><strong>Requirements:</strong> Clear state management with visual feedback"
        }
      },
      {
        number: 2,
        subtitle: "Phase 2",
        title: "Design & Planning",
        description: "Design-first approach using Figma to establish visual foundation before development. Single iteration design process with minimal revisions, focusing on clear state management and responsive design considerations.",
        outputs: {
          title: "Design Decisions",
          content: "<strong>Tool:</strong> Figma for initial design and prototyping<br><strong>Approach:</strong> Single iteration design process<br><strong>Visual Style:</strong> FIFA 22 inspired interface with custom animated background<br><strong>Responsive Strategy:</strong> CSS-based responsive design with mobile-first considerations"
        }
      },
      {
        number: 3,
        subtitle: "Phase 3",
        title: "Technical Implementation",
        description: "Built using React with custom state management and deployed via Azure Static Web Apps. Complex timer logic requiring careful tracking of current state, remaining time, and transition logic. First major React project focusing on useState and useEffect hooks.",
        outputs: {
          title: "Technical Achievements",
          content: "<strong>State Management:</strong> Complex timer logic with React hooks<br><strong>UI Synchronization:</strong> Visual feedback system reflecting timer state changes<br><strong>Custom Animation:</strong> Canvas-based animated blob system with 25 floating elements<br><strong>Deployment:</strong> Successfully deployed to Azure Static Web Apps"
        }
      },
      {
        number: 4,
        subtitle: "Phase 4",
        title: "Testing & Refinement",
        description: "Informal testing and community feedback leading to mobile layout improvements. Identified and resolved button alignment problems on mobile devices through redesigned positioning and spacing.",
        outputs: {
          title: "Improvements",
          content: "<strong>Mobile Issues:</strong> Community feedback identified button alignment problems<br><strong>Resolution:</strong> Redesigned button positioning and spacing<br><strong>Testing:</strong> Verified functionality across multiple device sizes<br><strong>Learning:</strong> Gained experience with React development and cloud deployment"
        }
      }
    ],
    primaryAction: {
      text: "Live Demo",
      url: "https://salmon-moss-0c44ef41e.6.azurestaticapps.net"
    },
    secondaryAction: {
      text: "GitHub",
      url: "#"
    }
  },
  portfolio: {
    title: "Personal Portfolio Website",
    overview: "Interactive portfolio website designed specifically for recruiters to quickly understand my interests, skills, and experience. Focused on creating a scannable, readable interface without sacrificing depth of information, recognizing that recruiters often quickly scan portfolios due to high application volumes.",
    role: "Designer & Developer",
    timeline: "April - June 2025",
    team: "Personal Project",
    features: [
      "Custom marching squares background animation",
      "Dynamic color transitions between sections",
      "Responsive design supporting multiple screen sizes",
      "Interactive project cards with overlay system",
      "Progressive disclosure approach"
    ],
    tech: ["HTML/CSS", "JavaScript", "anime.js", "Figma", "Canvas API"],
    phases: [
      {
        number: 1,
        subtitle: "Phase 1",
        title: "Research & Analysis",
        description: "Analyzed existing portfolio examples to identify key design principles and best practices for developer portfolios. Focused on understanding what makes portfolios effective for recruiter review and rapid information processing.",
        outputs: {
          title: "Key Insights",
          content: "<strong>Progressive Disclosure:</strong> Essential for managing information density<br><strong>Scannability:</strong> Clear visual hierarchy and rapid information processing<br><strong>Aesthetic Design:</strong> Consistent design language and visual cohesion<br><strong>Best Practices:</strong> Analyzed successful developer portfolios"
        }
      },
      {
        number: 2,
        subtitle: "Phase 2",
        title: "Design & Iteration",
        description: "The design underwent significant iteration based on both personal reflection and community feedback. Originally planned 3 separate animations, simplified to single marching squares algorithm for cohesive design. 5+ iterations on project cards focused on readability.",
        outputs: {
          title: "Design Evolution",
          content: "<strong>Background Animation:</strong> Simplified from 3 animations to single marching squares<br><strong>Project Cards:</strong> 5+ iterations focused on readability and hierarchy<br><strong>Hero Section:</strong> Redesigned for visual consistency<br><strong>Community Feedback:</strong> 2 sessions with Reddit and Discord users"
        }
      },
      {
        number: 3,
        subtitle: "Phase 3",
        title: "Technical Implementation",
        description: "Developed custom solutions for performance and responsive design challenges. Marching squares animation optimized for lower-end devices, reducing from 30 fps to 10 fps. Custom color-shifting system using HTML data attributes and JavaScript.",
        outputs: {
          title: "Technical Solutions",
          content: "<strong>Performance:</strong> Optimized from 30fps to 10fps for broader compatibility<br><strong>Section Transitions:</strong> Custom color-shifting using HTML data attributes<br><strong>Responsive Design:</strong> Scalable CSS with media queries for mobile to 4K<br><strong>Navigation:</strong> Replaced menu button with color-coded navigation dots"
        }
      },
      {
        number: 4,
        subtitle: "Phase 4",
        title: "Testing & Refinement",
        description: "Informal user testing revealed navigation and scaling issues, leading to final refinements. Increased contrast of buttons and text, implemented progressive disclosure for projects, and refined mobile responsiveness.",
        outputs: {
          title: "Final Improvements",
          content: "<strong>Contrast:</strong> Improved button and About Me section contrast<br><strong>Progressive Disclosure:</strong> Added detailed project overlays<br><strong>Element Consistency:</strong> Unified sizing and scaling across components<br><strong>Performance:</strong> Optimized for broader device compatibility"
        }
      }
    ],
    primaryAction: {
      text: "You're Here!",
      url: "#"
    },
    secondaryAction: {
      text: "GitHub",
      url: "https://github.com/ethanluchs/Portfolio-Site"
    }
  }
};

// Modal functions
function openProjectModal(projectKey) {
  const modal = document.getElementById('projectModal');
  const project = projectData[projectKey];

  if (!project) {
    console.error('Project not found:', projectKey);
    return;
  }

  // Populate modal content
  document.getElementById('modalTitle').textContent = project.title;
  document.getElementById('projectOverview').textContent = project.overview;
  document.getElementById('projectRole').textContent = project.role;
  document.getElementById('projectTimeline').textContent = project.timeline;
  document.getElementById('projectTeam').textContent = project.team;

  // Populate features
  const featuresList = document.getElementById('keyFeatures');
  featuresList.innerHTML = '';
  project.features.forEach(feature => {
    const li = document.createElement('li');
    li.textContent = feature;
    featuresList.appendChild(li);
  });

  // Populate tech stack
  const techStack = document.getElementById('techStack');
  techStack.innerHTML = '';
  project.tech.forEach(tech => {
    const span = document.createElement('span');
    span.className = 'tech-tag';
    span.textContent = tech;
    techStack.appendChild(span);
  });

  // Populate phases
  const phasesContainer = document.getElementById('projectPhases');
  phasesContainer.innerHTML = '';
  project.phases.forEach(phase => {
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'phase-section';
    phaseDiv.innerHTML = `
            <div class="phase-number">${phase.number}</div>
            <div class="phase-subtitle">${phase.subtitle}</div>
            <h3 class="phase-title">${phase.title}</h3>
            <p class="phase-description">${phase.description}</p>
            <div class="phase-outputs">
                <div class="outputs-title">${phase.outputs.title}</div>
                <div class="outputs-list">${phase.outputs.content}</div>
            </div>
        `;
    phasesContainer.appendChild(phaseDiv);
  });

  // Set up action buttons
  const primaryBtn = document.getElementById('primaryAction');
  const secondaryBtn = document.getElementById('secondaryAction');

  primaryBtn.textContent = project.primaryAction.text;
  primaryBtn.href = project.primaryAction.url;

  secondaryBtn.textContent = project.secondaryAction.text;
  secondaryBtn.href = project.secondaryAction.url;

  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('projectModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeProjectModal();
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeProjectModal();
    }
  });
});