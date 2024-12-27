export const TEXT_ANIMATION_SCHEMAS = {
    slidestack: {
        name: "Slide Stack",
        description: "Slides text lines in from alternating sides",
        config: {
            slideDistance: {
                type: "number",
                default: 100,
                min: 0,
                max: 500,
                description: "Distance in pixels text slides from"
            },
            slideDuration: {
                type: "number",
                default: 0.5,
                min: 0.1,
                max: 2.0,
                description: "Duration of slide animation"
            },
            pushDuration: {
                type: "number",
                default: 0.4,
                min: 0.1,
                max: 2.0,
                description: "Duration of push animation"
            },
            bottomPadding: {
                type: "number",
                default: 50,
                min: 0,
                max: 200,
                description: "Padding from bottom of screen"
            }
        }
    }
};