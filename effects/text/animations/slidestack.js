export class SlideStackAnimation {
    constructor(config) {
        this.config = config;
        this.LINE_HEIGHT = 30;
        this.reset();
    }

    reset() {
        this.currentVerse = 0;
        this.currentLine = 0;
        this.activeLines = [];
        this.container = null;
        this.textContainer = null;
        this.backgroundContainer = null;
        this.background = null;
    }

    drawInitialBackground() {
        this.background.clear();
        this.background.beginFill(0x000000, 0.7);
        this.background.drawRoundedRect(
            -200,  // Centered horizontally
            -20,   // Above the container's position
            400,   // Width
            100,   // Height
            10     // Corner radius
        );
        this.background.endFill();
        // Set initial background to invisible
        this.background.alpha = 0;
    }

    createContainer(app) {
        this.app = app;
        
        // Main container
        this.container = new PIXI.Container();
        this.container.position.set(
            app.screen.width / 2,
            app.screen.height - this.config.bottomPadding
        );

        // Background container at bottom layer
        this.backgroundContainer = new PIXI.Container();
        this.container.addChild(this.backgroundContainer);

        // Text container on top
        this.textContainer = new PIXI.Container();
        this.container.addChild(this.textContainer);

        this.background = new PIXI.Graphics();
        this.drawInitialBackground();
        this.backgroundContainer.addChild(this.background);

        console.log('Container setup:', {
            containerPosition: this.container.position,
            backgroundParent: this.background.parent,
            containerChildren: this.container.children
        });

        return this.container;
    }

    setupTextLine(content) {
        const text = new PIXI.Text(content, {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fill: '#FFFFFF',
            align: 'center',
            resolution: 2,
        });
        text.anchor.set(0.5);
        return text;
    }

    updateBackground() {
        console.log('updateBackground called. Active lines:', this.activeLines.length);
        
        if (this.activeLines.length === 0) {
            // Fade out background when no lines
            gsap.to(this.background, {
                alpha: 0,
                duration: 0.3,
                ease: "power2.out"
            });
            return;
        }

        const bounds = this.activeLines.reduce((acc, line, index) => {
            const globalBounds = line.getBounds();
            const localBounds = this.backgroundContainer.toLocal(
                new PIXI.Point(globalBounds.x, globalBounds.y)
            );
            if (index === 0) {
                return {
                    x: localBounds.x,
                    y: localBounds.y,
                    width: globalBounds.width,
                    height: globalBounds.height
                };
            }
            return {
                x: Math.min(acc.x, localBounds.x),
                y: Math.max(acc.y, localBounds.y),
                width: Math.max(acc.width, globalBounds.width),
                height: Math.max(acc.height, globalBounds.y + globalBounds.height - acc.y)
            };
        }, null);

        const lheight = this.LINE_HEIGHT * this.activeLines.length;
        const padding = 20;
        this.background.clear();
        this.background.beginFill(0x000000, 0.7);
        this.background.drawRoundedRect(
            bounds.x - padding,
            -lheight,
            bounds.width + (padding * 2),
            lheight + (padding * 2),
            10
        );
        this.background.endFill();

        // If this is the first line being added, fade in the background
        if (this.activeLines.length === 1) {
            this.background.alpha = 0;
            gsap.to(this.background, {
                alpha: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    }

    animateNextLine() {
        if (!this.verses || !this.verses[this.currentVerseIndex]) {
            console.warn('No verses available or invalid verse index');
            return false;
        }
        if (this.currentLine >= this.verses[this.currentVerseIndex].lines.length) {
            if (this.currentVerseIndex + 1 < this.verses.length) {
                this.clear(() => {
                    this.currentVerseIndex++;
                    this.currentLine = 0;
                    this.animateNextLine();
                });
            }
            return false;
        }

        const currentVerse = this.verses[this.currentVerseIndex];
        const line = currentVerse.lines[this.currentLine];
        const textLine = this.setupTextLine(line);
        
        console.log('Before adding new line. Active lines:', this.activeLines.length);
        
        // Add text to text container instead of main container
        this.textContainer.addChild(textLine);
        this.activeLines.push(textLine);
        
        console.log('After adding new line. Active lines:', this.activeLines.length);

        this.updateBackground();

        const tl = gsap.timeline();

        this.activeLines.forEach((line, index) => {
            if (index < this.activeLines.length - 1) {
                tl.to(line, {
                    y: this.getTargetY(index),
                    duration: this.config.pushDuration,
                    ease: "power2.inOut"
                }, 0);
            }
        });

        const slideFromRight = this.currentLine % 2 === 1;
        textLine.position.x = slideFromRight ? 
            this.config.slideDistance : 
            -this.config.slideDistance;
        textLine.position.y = 0;
        textLine.alpha = 0;

        tl.to(textLine, {
            x: 0,
            alpha: 1,
            duration: this.config.slideDuration,
            ease: "power2.out"
        }, 0);

        tl.to(textLine, {
            y: this.getTargetY(this.activeLines.length - 1),
            duration: this.config.pushDuration,
            ease: "power2.inOut"
        }, 0);

        this.currentLine++;
        return true;
    }

    clear(onComplete) {
        if (this.activeLines.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => {
                this.activeLines.forEach(line => {
                    this.textContainer.removeChild(line);
                });
                this.activeLines = [];
                if (onComplete) onComplete();
            }
        });

        this.activeLines.forEach(line => {
            tl.to(line, {
                alpha: 0,
                y: line.position.y - this.LINE_HEIGHT,
                duration: 0.5,
                ease: "power2.inOut"
            }, 0);
        });
    }

    getTargetY(lineIndex) {
        return -this.LINE_HEIGHT * (this.activeLines.length - lineIndex - 1);
    }

    setVerses(container, verses) {
        this.verses = verses;
        this.currentVerseIndex = 0;
        this.currentLine = 0;
        this.activeLines = [];
    }

    hasMoreContent() {
        return this.currentVerseIndex < this.verses.length && 
               this.currentLine < this.verses[this.currentVerseIndex].lines.length;
    }

    async complete() {
        return new Promise(async (resolve) => {
            while (this.hasMoreContent()) {
                await new Promise(animDone => {
                    const tl = gsap.timeline({
                        onComplete: () => animDone()
                    });
                    this.animateNextLine();
                });
            }
            resolve();
        });
    }
}