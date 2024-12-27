export const GEOMETRY_TYPE_SCHEMAS = {
    lineart: {
        name: 'Line Art',
        description: 'Vector paths extracted from image edges',
        dataFormat: {
            levels: {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        points: {
                            type: 'array',
                            items: { x: 'number', y: 'number' }
                        },
                        color: 'string',
                        width: 'number'
                    }
                }
            }
        }
    },
    pointcloud: {
        name: 'Point Cloud',
        description: 'Collection of points sampled from image',
        dataFormat: {
            points: {
                type: 'array',
                items: {
                    x: 'number',
                    y: 'number',
                    color: 'string',
                    size: 'number'
                }
            }
        }
    }
};