import { FallingAnimation } from '../effects/geometry/animations/falling.js';
import { WaterFallAnimation } from '../effects/geometry/animations/waterfall.js';
import { PanZoomAnimation } from '../effects/image/animations/panzoom.js';
import { SlideStackAnimation } from '../effects/text/animations/slidestack.js';

export const GeometryAnimations = {
    'falling': FallingAnimation,
    'waterfall': WaterFallAnimation
};

export const ImageAnimations = {
    'panzoom': PanZoomAnimation
};

export const TextAnimations = {
    'slidestack': SlideStackAnimation
};

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
        throw new Error(`Unknown image animation type: ${type}`);
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