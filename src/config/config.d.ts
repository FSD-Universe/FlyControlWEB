type Config = {
    icon_path: string;
    title: string;
    backend_url: string;
    mapbox_token: string;
    flight_path_color: string;
    atc_border: string,
    atc_fill: string,
    facilities: string[];
    activity_status: {
        label: string;
        class: string;
        value: number;
    }[];
    pilot_status: {
        label: string;
        class: string;
        value: number;
    }[];
    ratings: {
        label: string;
        value: number;
        color: string;
    }[];
}

type Airport = {
    icao: string;
    value: string;
}

type Airports = Airport[]

type Facility = {
    value: string;
    callsign: string;
    frequency: string;
    tier2: boolean;
    min_ratings: number;
}

type Facilities = Facility[]

type StaffInfo = {
    nickname: string;
    qq: string;
    email: string;
    description: string;
}

type Job = StaffInfo & {
    office: string;
    qq: string;
}

type HomeConfig = {
    title: string;
    contact_email: string;
    content: {
        github: string;
        qq_group: number;
        qq_join_link: string;
        icp: string;
        icp_police: string;
        icp_police_url: string;
        copyright: string;
        bilibili_name: string;
        bilibili_uid: number;
        eaip_mirror_url: string;
        chart_mirror_url: string;
        teamspeak_server: string;
        teamspeak_server_password: string;
        qq_group_name: string;
    };
    partner: {
        image: string;
        url: string;
    }[];
    meetings: {
        name: string;
        file_url: string;
        file_display_name: string;
    }[];
    software: {
        name: string;
        platform: {
            windows: boolean;
            linux: boolean;
            macos: boolean;
        };
        description: string;
        version: string;
        file_url: string;
        official_uri: string;
    }[];
    staff: {
        staffers: {
            [key: string]: StaffInfo;
        },
        officer: Job[],
        technical_department: Job[],
        train_department: {
            train: Job[],
            sector: Job[],
        },
        activity_department: Job[],
    };
}