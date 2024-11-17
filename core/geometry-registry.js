import { LineArtGeometry } from '../effects/geometry/types/lineart.js';
import { PointCloudGeometry } from '../effects/geometry/types/pointcloud.js';

// import { SVGGeometry } from '../effects/geometry/types/svg.js';

export const GeometryTypes = {
    'lineart': LineArtGeometry,
    'pointcloud': PointCloudGeometry,
    // 'svg': SVGGeometry,
};

export function getGeometryType(type) {
    const GeometryClass = GeometryTypes[type];
    if (!GeometryClass) {
        throw new Error(`Unknown geometry type: ${type}`);
    }
    return GeometryClass;
}

// Helper function to get the correct asset path for a geometry type
export function getGeometryAssetPath(type, filename) {
    return `assets/geometry/${type}/${filename}`;
}