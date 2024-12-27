import { FallingAnimation } from '../effects/geometry/animations/falling.js';
import { WaterFallAnimation } from '../effects/geometry/animations/waterfall.js';
import { FadeInAnimation } from '../effects/image/animations/fadein.js';
import { PanZoomAnimation } from '../effects/image/animations/panzoom.js';
import { SlideStackAnimation } from '../effects/text/animations/slidestack.js';

import { GEOMETRY_ANIMATION_SCHEMAS } from '../schemas/animations/geometry.js';
import { IMAGE_ANIMATION_SCHEMAS } from '../schemas/animations/image.js';
import { TEXT_ANIMATION_SCHEMAS } from '../schemas/animations/text.js';


export const GeometryAnimations = {
    'falling': FallingAnimation,
    'waterfall': WaterFallAnimation
};

export const ImageAnimations = {
    'panzoom': PanZoomAnimation,
    'fadein': FadeInAnimation
};

export const TextAnimations = {
    'slidestack': SlideStackAnimation
};

// Helper function to validate animation configs against schemas
function validateConfig(config, schema) {
    // Basic validation - could be expanded
    return true;
}

export function getGeometryAnimation(type) {
    const AnimationClass = GeometryAnimations[type];
    if (!AnimationClass) {
        throw new Error(`Unknown geometry animation type: ${type}`);
    }
    return AnimationClass;
}

export function getImageAnimation(type) {
    const AnimationClass = ImageAnimations[type];
    if (!AnimationClass) {
        // Return default fade-in animation if no animation specified
        return FadeInAnimation;
    }
    return AnimationClass;
}

export function getTextAnimation(type) {
    const AnimationClass = TextAnimations[type];
    if (!TextAnimations[type]) {
        throw new Error(`Unknown text animation type: ${type}`);
    }
    return AnimationClass;
}

// Export schemas for use in configuration tools
export const AnimationSchemas = {
    geometry: GEOMETRY_ANIMATION_SCHEMAS,
    image: IMAGE_ANIMATION_SCHEMAS,
    text: TEXT_ANIMATION_SCHEMAS
};