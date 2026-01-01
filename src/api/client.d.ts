type OnlineControllerModel = {
    atc_info: string[];
    callsign: string;
    cid: number;
    facility: number;
    frequency: number;
    latitude: number;
    logon_time: string;
    offline_time: string;
    is_break: boolean;
    longitude: number;
    rating: number;
    real_name: string;
}

type OnlinePilotModel = {
    altitude: number;
    callsign: string;
    cid: number;
    flight_plan: FlightPlanModel;
    ground_speed: number;
    heading: number;
    latitude: number;
    logon_time: string;
    longitude: number;
    real_name: string;
    transponder: string;
}

type OnlineClientModel = {
    general: {
        connected_clients: number;
        generate_time: string;
        online_controller: number;
        online_pilot: number;
        version: number;
    };
    controllers: OnlineControllerModel[];
    pilots: OnlinePilotModel[];
}

type FlightPathPoint = {
    latitude: number;
    longitude: number;
    altitude: number;
    ground_speed: number;
    timestamp: number;
}