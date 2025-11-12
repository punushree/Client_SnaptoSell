export interface ProductDetectResponse {
    success?: boolean;
    data?:    Data;
}

export interface Data {
    uuid?:     string;
    status?:   string;
    analysis?: Analysis;
    summary?:  string;
    images?:   string[];
}

export interface Analysis {
    identified_product?:   string;
    brand?:                string;
    color_variants?:       string;
    model_or_series?:      string;
    distinctive_features?: string;
    possible_confusion?:   string;
    clarity_feedback?:     string;
    short_description?:    string;
    condition_rating?:     number;
    rating_reason?:        string;
    estimated_year?:       string;
}
