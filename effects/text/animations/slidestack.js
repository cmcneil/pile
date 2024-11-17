export class SlideStackAnimation {
    constructor(config) {
        this.config = config;
        this.verses = [];
        this.currentVerseIndex = 0;
        this.currentLine = 0;
        this.activeLines = [];
        this.container = null;
        this.LINE_HEIGHT = 32;
    }

    createContainer(app) {
        this.container = new PIXI.Container();
        this.container.position.set(
            app.screen.width / 2,
            app.screen.height - this.config.bottomPadding
        );
        return this.container;
    }

    setupTextLine(content) {
        const text = new PIXI.Text(content, {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fill: '#FFFFFF',
            align: 'center'
        });
        text.anchor.set(0.5);
        return text;
    }

    setVerses(container, verses) {
        this.verses = verses;
        this.currentVerseIndex = 0;
        this.currentLine = 0;
        this.activeLines = [];
        this.container = container;
    }

    getTargetY(lineIndex) {
        return -this.LINE_HEIGHT * (this.activeLines.length - lineIndex);
    }

    clear(onComplete) {
        if (this.activeLines.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => {
                this.activeLines.forEach(line => {
                    this.container.removeChild(line);
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

    animateNextLine() {
        // Check if we're done with current verse
        if (this.currentLine >= this.verses[this.currentVerseIndex].lines.length) {
            // Move to next verse if available
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
        
        // Set initial position
        const slideFromRight = this.currentLine % 2 === 1;
        textLine.position.x = slideFromRight ? 
            this.config.slideDistance : 
            -this.config.slideDistance;
        textLine.position.y = 0;
        textLine.alpha = 0;

        this.container.addChild(textLine);
        this.activeLines.push(textLine);

        const tl = gsap.timeline();

        // Move existing lines up
        this.activeLines.forEach((line, index) => {
            if (index < this.activeLines.length - 1) {
                tl.to(line, {
                    y: this.getTargetY(index),
                    duration: this.config.pushDuration,
                    ease: "power2.inOut"
                }, 0);
            }
        });

        // Slide in new line
        tl.to(textLine, {
            x: 0,
            alpha: 1,
            duration: this.config.slideDuration,
            ease: "power2.out"
        }, 0);

        // Move new line to position
        tl.to(textLine, {
            y: this.getTargetY(this.activeLines.length - 1),
            duration: this.config.pushDuration,
            ease: "power2.inOut"
        }, 0);

        this.currentLine++;
        return true;
    }
}