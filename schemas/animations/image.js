export const IMAGE_ANIMATION_SCHEMAS = {
    fadein: {
        name: "Fade In",
        description: "Simple fade in animation",
        config: {
            duration: {
                type: "number",
                default: 1.5,
                min: 0.1,
                max: 5.0,
                description: "Duration of fade"
            },
            ease: {
                type: "select",
                default: "power2.inOut",
                options: ["power1.inOut", "power2.inOut", "power3.inOut", "sine.inOut"],
                description: "Easing function"
            }
        }
    },
    panzoom: {
        name: "Pan & Zoom",
        description: "Camera-like pan and zoom effects",
        config: {
            fadeIn: {
                type: "group",
                fields: {
                    duration: {
                        type: "number",
                        default: 2,
                        min: 0.1,
                        max: 5.0
                    },
                    ease: {
                        type: "select",
                        default: "power2.inOut",
                        options: ["power1.inOut", "power2.inOut", "power3.inOut", "sine.inOut"]
                    }
                }
            },
            fadeOut: {
                type: "group",
                fields: {
                    duration: {
                        type: "number",
                        default: 2,
                        min: 0.1,
                        max: 5.0
                    },
                    ease: {
                        type: "select",
                        default: "power2.inOut",
                        options: ["power1.inOut", "power2.inOut", "power3.inOut", "sine.inOut"]
                    }
                }
            },
            transitionEase: {
                type: "select",
                default: "power2.inOut",
                options: ["power1.inOut", "power2.inOut", "power3.inOut", "sine.inOut"]
            },
            keyframes: {
                type: "keyframes",
                description: "Series of view positions"
            }
        }
    }
};