import { IMAGE_ANIMATION_SCHEMAS } from './animations/image.js';
import { GEOMETRY_ANIMATION_SCHEMAS } from './animations/geometry.js';
import { TEXT_ANIMATION_SCHEMAS } from './animations/text.js';
import { GEOMETRY_TYPE_SCHEMAS } from './geometry/index.js';
import { SCENE_SCHEMA } from './scene.js';

// Combined schemas for the config tool
export const ANIMATION_SCHEMAS = {
    image: IMAGE_ANIMATION_SCHEMAS,
    geometry: GEOMETRY_ANIMATION_SCHEMAS,
    text: TEXT_ANIMATION_SCHEMAS
};

// Also export individual schemas if needed
export {
    IMAGE_ANIMATION_SCHEMAS,
    GEOMETRY_ANIMATION_SCHEMAS,
    TEXT_ANIMATION_SCHEMAS,
    GEOMETRY_TYPE_SCHEMAS,
    SCENE_SCHEMA
};