import { IMAGE_ANIMATION_SCHEMAS } from './animations/image.js';
import { GEOMETRY_ANIMATION_SCHEMAS } from './animations/geometry.js';
import { TEXT_ANIMATION_SCHEMAS } from './animations/text.js';
import { GEOMETRY_TYPE_SCHEMAS } from './geometry/index.js';

export const SCENE_SCHEMA = {
    // Core properties
    id: String,
    duration: Number,

    // Image configuration
    image: {
        path: String,
        padding: Number,
        animation: {
            type: {
                type: String,
                enum: Object.keys(IMAGE_ANIMATION_SCHEMAS)
            },
            config: Object
        },
        geometry: {
            type: {
                type: String,
                enum: Object.keys(GEOMETRY_TYPE_SCHEMAS)
            },
            data: String,
            animation: {
                type: {
                    type: String,
                    enum: Object.keys(GEOMETRY_ANIMATION_SCHEMAS)
                },
                config: Object
            }
        }
    },

    // Text configuration
    text: {
        verses: [{
            id: Number,
            lines: [String]
        }],
        animation: {
            type: {
                type: String,
                enum: Object.keys(TEXT_ANIMATION_SCHEMAS)
            },
            config: Object
        }
    }
};