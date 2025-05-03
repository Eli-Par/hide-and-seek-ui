export interface ShapePoint {
    shape_pt_lat: string;
    shape_pt_lon: string;
    shape_pt_sequence: string;
}

export interface Route {
    route_id: string;
    trip_headsign: string;
    route_color?: string;
    shape: ShapePoint[];
}
