export class PointCloudGeometry {
    static type = 'pointcloud';
    
    constructor(data) {
        if (!Array.isArray(data.points)) {
            throw new Error('PointCloud geometry data must contain points array');
        }
        this.points = data.points;
        this.validateData();
    }

    validateData() {
        this.points.forEach((point, i) => {
            if (!point || 
                typeof point.x !== 'number' || 
                typeof point.y !== 'number') {
                throw new Error(`Invalid point at index ${i}`);
            }
        });
    }

    getPoints() {
        return this.points;
    }
}