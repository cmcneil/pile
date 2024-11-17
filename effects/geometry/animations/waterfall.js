export class WaterFallAnimation {
    static supportedTypes = ['pointcloud'];
    
    constructor(geometry, config) {
        this.geometry = geometry;
        this.config = {
            particleSize: 2,
            gravity: 0.5,
            horizontalDispersion: 0.2,
            bounce: 0.3,
            friction: 0.1,
            rasterFade: {
                duration: 2,
                ease: "power2.inOut"
            },
            pointsFade: {
                duration: 10,
                stagger: 0.5
            },
            ...config
        };
        
        this.engine = window.Matter.Engine.create({
            gravity: { x: 0, y: this.config.gravity }
        });
    }

    createTimeline(container, imageScale, dimensions, renderer) {
        const { World, Bodies, Body, Engine } = window.Matter;

        const bounds = {
            left: -dimensions.width * imageScale / 2,
            right: dimensions.width * imageScale / 2,
            top: -dimensions.height * imageScale / 2,
            bottom: dimensions.height * imageScale / 2
        };

        // Create boundary bodies
        const wallThickness = 20;
        const walls = [
            // Floor
            Bodies.rectangle(
                0,  // centered horizontally
                bounds.bottom + wallThickness / 2,  // at the bottom
                dimensions.width * imageScale * 2,  // full width
                wallThickness,
                { isStatic: true }
            ),
            // Left wall
            // Bodies.rectangle(
            //     bounds.left - wallThickness/2,
            //     bounds.bottom - wallThickness/2,
            //     wallThickness,
            //     wallThickness * 2,  // short wall
            //     { isStatic: true }
            // ),
            // // Right wall
            // Bodies.rectangle(
            //     bounds.right + wallThickness/2,
            //     bounds.bottom - wallThickness/2,
            //     wallThickness,
            //     wallThickness * 2,  // short wall
            //     { isStatic: true }
            // )
        ];
        
        const points = this.geometry.getPoints();

        // Create a particle texture first
        const particleGraphics = new PIXI.Graphics();
        particleGraphics.beginFill(0xFFFFFF);
        particleGraphics.drawCircle(0, 0, this.config.particleSize);
        particleGraphics.endFill();
        const particleTexture = renderer.generateTexture(particleGraphics);
        
        // Create particle container
        const particles = new PIXI.ParticleContainer(points.length, {
            position: true,
            alpha: true
        });
        particles.alpha = 0;
        container.addChild(particles);
        
        // Create all particles and physics bodies
        const bodies = points.map(point => {
            const particle = new PIXI.Sprite(particleTexture);
            particle.anchor.set(0.5);
            particle.x = (point.x - dimensions.width/2) * imageScale;
            particle.y = (point.y - dimensions.height/2) * imageScale;
            particle.alpha = 0;
            particles.addChild(particle);
            
            const body = Bodies.circle(
                particle.x,
                particle.y,
                this.config.particleSize,
                {
                    restitution: this.config.bounce,
                    friction: this.config.friction,
                    density: 0.001,  // Make particles lighter
                    frictionAir: 0.001  // add air resistance
                }
            );
            
            return { body, sprite: particle };
        });

        let isSimulating = false;
        let currentPhase = 0;
        let animationFrame = null;
        
        const cleanupSimulation = () => {
            if (isSimulating) {
                isSimulating = false;
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }
                World.clear(this.engine.world);
                Engine.clear(this.engine);
                particleTexture.destroy(true);
            }
        };
        
        const tl = gsap.timeline({
            paused: true,
            onComplete: cleanupSimulation
        });

        // Phase 1: Fade in raster image
        tl.to(container.originalImage, {
            alpha: 1,
            duration: this.config.rasterFade.duration,
            ease: this.config.rasterFade.ease
        });

        // Add pause point for second key press
        tl.addPause();

        // Phase 2: Fade in particles and start physics
        tl.to(particles, {
            alpha: 1,
            duration: 0.5
        });

        tl.to(particles.children, {
            alpha: 1,
            duration: 2.0,
            stagger: {
                from: "random",
                amount: this.config.pointsFade.stagger
            }
        });

        // Fade out raster image
        tl.to(container.originalImage, {
            alpha: 0,
            duration: this.config.rasterFade.duration,
            ease: this.config.rasterFade.ease
        });

        // Start physics simulation
        tl.add(() => {
            isSimulating = true;
            // Add walls first
            World.add(this.engine.world, walls);
            World.add(this.engine.world, bodies.map(b => b.body));
            
            bodies.forEach(({ body }) => {
                Body.setVelocity(body, {
                    x: (Math.random() - 0.5) * this.config.horizontalDispersion,
                    y: 0
                });
            });
            
            const update = () => {
                if (!isSimulating) return;
                
                Engine.update(this.engine, 1000 / 60);
                
                bodies.forEach(({ body, sprite }) => {
                    sprite.x = body.position.x;
                    sprite.y = body.position.y;
                });
                
                animationFrame = requestAnimationFrame(update);
            };
            
            update();
        });

        // Add a delay to ensure physics runs for a while
        tl.to({}, { duration: this.config.pointsFade.duration });  // Adjust this duration as needed

        // Fade out everything
        tl.to([container.originalImage, particles], {
            alpha: 0,
            duration: 1,
            ease: "power2.inOut",
            onComplete: cleanupSimulation
        });

        return {
            timeline: tl,
            handleKeyPress: () => {
                if (currentPhase === 0) {
                    tl.play();
                    currentPhase++;
                } else if (currentPhase === 1) {
                    tl.resume();
                    currentPhase++;
                }
            }
        };
    }
}