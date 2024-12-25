// effects/image/animations/fadein.js
export class FadeInAnimation {
    constructor(config = {}) {
        this.config = {
            duration: config.duration || 1.5,
            ease: config.ease || "power2.inOut"
        };
    }

    createTimeline(container, scale, dimensions, renderer) {
        const image = container.children[container.children.length - 1];
        if (!image) {
            console.error('No image found in container');
            return gsap.timeline(); // Return empty timeline
        }
        image.alpha = 0; // Start fully transparent

        const timeline = gsap.timeline({ paused: true });
        timeline.to(image, {
            alpha: 1,
            duration: this.config.duration,
            ease: this.config.ease
        });

        return {
            timeline: timeline,
            handleKeyPress: () => {
                timeline.play();
            }
        };
    }

    isActive() {
        return false; // Once faded in, the animation is complete
    }

    handleKeyPress() {
        // No key handling needed for fade in
    }

    complete() {
        // Nothing to complete
    }
}