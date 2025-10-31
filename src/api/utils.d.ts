type PageDataResponse<T> = {
    items: T[];
    total: number;
    page: number;
    page_size: number;
}

type Nullable<T> = T | null

type Pixel = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

type BoundingBox = {
    pixels: Pixel;
    latlng?: {
        lng1: number;
        lat1: number;
        lng2: number;
        lat2: number;
    }
}

type AirportChartIndex = {
    image_day: string;
    image_night: string;
    thumb_day: string;
    thumb_night: string;
    icao_airport_identifier: string;
    id: string;
    type_code: string;
    category: string;
    precision_approach?: boolean;
    index_number: string;
    name: string;
    revision_date: string;
    is_georeferenced: boolean;
    width: number;
    height: number;
    bounding_boxes?: {
        planview: BoundingBox;
        minimums: BoundingBox;
        header: BoundingBox;
        insets: BoundingBox[];
    };
    procedures: string[];
    runways: string[];
    image_day_url: string;
    image_night_url: string;
    thumb_day_url: string;
    thumb_night_url: string;
    local_url?: string;
    dark_mode: boolean;
}