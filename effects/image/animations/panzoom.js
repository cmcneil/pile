export class PanZoomAnimation {
    constructor(config) {
        this.config = {
            fadeIn: {
                duration: 2,
                ease: "power2.inOut"
            },
            fadeOut: {
                duration: 2,
                ease: "power2.inOut"
            },
            transitionEase: "power2.inOut",
            ...config
        };
        this.currentKeyframe = -1;
    }

    createTimeline(container, imageScale, dimensions) {
        const image = container.originalImage;
        image.alpha = 0;

        const maxScale = Math.max(
            window.innerWidth / dimensions.width,
            window.innerHeight / dimensions.height
        ) * 2;

        const mainTL = gsap.timeline({ paused: true });

        const animateToKeyframe = (index) => {
            console.log(`Animating to keyframe ${index}`);
            mainTL.clear();
            
            if (index >= this.config.keyframes.length) {
                console.log('No more keyframes, starting fadeout');
                mainTL.to(image, {
                    alpha: 0,
                    duration: this.config.fadeOut.duration,
                    ease: this.config.fadeOut.ease
                });
                mainTL.play();
                return;
            }

            const view = this.config.keyframes[index].view;
            console.log('Current view:', view);
            
            console.log('Current image state:', {
                x: image.position.x,
                y: image.position.y,
                scale: image.scale.x
            });

            const targetScale = Math.min(view.scale * imageScale, maxScale);
            
            // Create a proxy object for the animation
            const proxy = {
                x: image.position.x,
                y: image.position.y,
                scale: image.scale.x
            };

            if (index === 0) {
                console.log('First keyframe - setting position');
                image.scale.set(targetScale);
                image.position.set(
                    window.innerWidth / 2,
                    window.innerHeight / 2
                );
                mainTL.to(image, {
                    alpha: 1,
                    duration: this.config.fadeIn.duration,
                    ease: this.config.fadeIn.ease
                });
            } else {
                console.log('Animating to new position with scale:', targetScale);
                
                // Calculate position based on scale
                const targetX = window.innerWidth / 2 - 
                              (view.x * dimensions.width - dimensions.width / 2) * targetScale;
                const targetY = window.innerHeight / 2 - 
                              (view.y * dimensions.height - dimensions.height / 2) * targetScale;

                mainTL.to(proxy, {
                    x: targetX,
                    y: targetY,
                    scale: targetScale,
                    duration: view.duration,
                    ease: this.config.transitionEase,
                    onUpdate: () => {
                        // Update PIXI object from proxy
                        image.position.set(proxy.x, proxy.y);
                        image.scale.set(proxy.scale);
                        
                        console.log('Animation progress -', {
                            x: image.position.x,
                            y: image.position.y,
                            scale: proxy.scale
                        });
                    }
                });
            }

            mainTL.play();
        };

        return {
            timeline: mainTL,
            handleKeyPress: () => {
                if (this.currentKeyframe === -1) {
                    this.currentKeyframe = 0;
                    animateToKeyframe(0);
                } else if (mainTL.isActive()) {
                    mainTL.progress(1);
                } else {
                    this.currentKeyframe++;
                    animateToKeyframe(this.currentKeyframe);
                }
            }
        };
    }
}