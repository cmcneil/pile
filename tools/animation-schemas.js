// Schema to describe configuration options for each animation type
const ANIMATION_SCHEMAS = {
    image: {
        'panzoom': {
            name: 'Pan & Zoom',
            config: {
                fadeIn: {
                    type: 'group',
                    fields: {
                        duration: { type: 'number', default: 2, min: 0, step: 0.1 },
                        ease: { type: 'select', options: ['power2.inOut', 'power2.out', 'none'], default: 'power2.inOut' }
                    }
                },
                fadeOut: {
                    type: 'group',
                    fields: {
                        duration: { type: 'number', default: 2, min: 0, step: 0.1 },
                        ease: { type: 'select', options: ['power2.inOut', 'power2.out', 'none'], default: 'power2.inOut' }
                    }
                },
                transitionEase: { type: 'select', options: ['power2.inOut', 'power2.out', 'linear'], default: 'power2.inOut' },
                keyframes: { type: 'keyframes' }  // Special type for keyframe UI
            }
        }
        // Add more image animation types here
    },
    geometry: {
        'falling': {
            name: 'Falling Geometry',
            requiresProcessor: true,
            processorType: 'lineart',
            config: {
                acceleration: { type: 'number', default: 2.0, min: 0, step: 0.1 },
                fallDuration: { type: 'number', default: 1.0, min: 0, step: 0.1 },
                fadeIn: {
                    type: 'group',
                    fields: {
                        startTime: { type: 'number', default: 3, min: 0, step: 0.1 },
                        duration: { type: 'number', default: 5, min: 0, step: 0.1 }
                    }
                },
                fadeOut: {
                    type: 'group',
                    fields: {
                        startTime: { type: 'number', default: 4, min: 0, step: 0.1 },
                        duration: { type: 'number', default: 4, min: 0, step: 0.1 }
                    }
                }
            }
        },
        'waterfall': {
            name: 'Water Fall Effect',
            requiresProcessor: true,
            processorType: 'pointcloud',
            config: {
                particleSize: { type: 'number', default: 2, min: 1, step: 1 },
                gravity: { type: 'number', default: 0.5, min: 0, step: 0.1 },
                horizontalDispersion: { type: 'number', default: 0.2, min: 0, step: 0.1 },
                bounce: { type: 'number', default: 0.3, min: 0, max: 1, step: 0.1 },
                friction: { type: 'number', default: 0.1, min: 0, max: 1, step: 0.1 }
            }
        }
    }
};