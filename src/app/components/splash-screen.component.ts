import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-screen" [class.hidden]="isHidden()">
      <div class="splash-content">
        <div class="logo-container">
          <img
            style="height:32px ; width:32px;"
            url="https://simplyfire.ai/wp-content/uploads/2025/02/cropped-SF-WP-favicon-32x32.png"
            src="https://simplyfire.ai/wp-content/uploads/2025/02/cropped-SF-WP-favicon-32x32.png"
            alt="SimplyFire AI Hub"
            class="logo"
          />
          <div class="logo-glow"></div>
        </div>
        <div class="loading-text">
          <span class="text">AI HUB</span>
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <div class="splash-background">
        <div class="gradient-overlay"></div>
        <div class="particles">
          <div class="particle" *ngFor="let particle of particles"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(
          135deg,
          #000000 0%,
          #1a1a1a 50%,
          #000000 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
        overflow: hidden;
        animation: backgroundShift 3s ease-in-out infinite;
      }

      .splash-screen.hidden {
        opacity: 0;
        visibility: hidden;
      }

      .splash-content {
        position: relative;
        z-index: 2;
        text-align: center;
        animation: fadeInUp 0.8s ease-out 0.2s both;
      }

      .logo-container {
        position: relative;
        margin-bottom: 2rem;
        animation: logoFloat 2s ease-in-out infinite;
      }

      .logo {
        width: 80px;
        height: 80px;
        animation: logoSpin 3s linear infinite,
          logoPulse 2s ease-in-out infinite;
        filter: drop-shadow(0 0 20px rgba(255, 122, 26, 0.6));
        transition: all 0.3s ease;
      }

      .logo:hover {
        transform: scale(1.1);
        filter: drop-shadow(0 0 30px rgba(255, 122, 26, 0.8));
      }

      .logo-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120px;
        height: 120px;
        background: radial-gradient(
          circle,
          rgba(255, 122, 26, 0.3) 0%,
          transparent 70%
        );
        border-radius: 50%;
        animation: glowPulse 2s ease-in-out infinite;
      }

      .loading-text {
        color: #ffffff;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      .text {
        display: block;
        margin-bottom: 1rem;
        background: linear-gradient(45deg, #ff7a1a, #ffb703, #ffd166);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: textGlow 2s ease-in-out infinite alternate;
      }

      .loading-dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
      }

      .loading-dots span {
        width: 8px;
        height: 8px;
        background: #ff7a1a;
        border-radius: 50%;
        animation: dotBounce 1.4s ease-in-out infinite both;
      }

      .loading-dots span:nth-child(1) {
        animation-delay: -0.32s;
      }
      .loading-dots span:nth-child(2) {
        animation-delay: -0.16s;
      }
      .loading-dots span:nth-child(3) {
        animation-delay: 0s;
      }

      .splash-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
      }

      .gradient-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
          circle at center,
          rgba(255, 122, 26, 0.1) 0%,
          rgba(0, 0, 0, 0.8) 70%,
          #000000 100%
        );
        animation: gradientShift 4s ease-in-out infinite;
      }

      .particles {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #ff7a1a;
        border-radius: 50%;
        animation: particleFloat 6s linear infinite;
        opacity: 0.6;
      }

      .particle:nth-child(odd) {
        animation-delay: -2s;
        animation-duration: 8s;
      }

      .particle:nth-child(even) {
        animation-delay: -4s;
        animation-duration: 10s;
      }

      /* Animations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes logoSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes logoFloat {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      @keyframes logoPulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      @keyframes glowPulse {
        0%,
        100% {
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          opacity: 0.6;
          transform: translate(-50%, -50%) scale(1.1);
        }
      }

      @keyframes textGlow {
        from {
          text-shadow: 0 0 10px rgba(255, 122, 26, 0.5);
        }
        to {
          text-shadow: 0 0 20px rgba(255, 122, 26, 0.8),
            0 0 30px rgba(255, 122, 26, 0.3);
        }
      }

      @keyframes dotBounce {
        0%,
        80%,
        100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1.2);
          opacity: 1;
        }
      }

      @keyframes gradientShift {
        0%,
        100% {
          opacity: 0.3;
        }
        50% {
          opacity: 0.6;
        }
      }

      @keyframes particleFloat {
        0% {
          transform: translateY(100vh) translateX(0);
          opacity: 0;
        }
        10% {
          opacity: 0.6;
        }
        90% {
          opacity: 0.6;
        }
        100% {
          transform: translateY(-100px) translateX(100px);
          opacity: 0;
        }
      }

      @keyframes backgroundShift {
        0%,
        100% {
          background: linear-gradient(
            135deg,
            #000000 0%,
            #1a1a1a 50%,
            #000000 100%
          );
        }
        50% {
          background: linear-gradient(
            135deg,
            #0a0a0a 0%,
            #2a2a2a 50%,
            #0a0a0a 100%
          );
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .logo {
          width: 60px;
          height: 60px;
        }

        .logo-glow {
          width: 100px;
          height: 100px;
        }

        .loading-text {
          font-size: 1.2rem;
        }
      }
    `,
  ],
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  isHidden = signal(false);
  particles = Array(20)
    .fill(0)
    .map((_, i) => i);

  ngOnInit() {
    // Hide splash screen after 500ms
    setTimeout(() => {
      this.isHidden.set(true);
    }, 1);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
