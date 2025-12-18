type UserModel = {
    id: number;
    username: string;
    email: string;
    cid: number;
    avatar_url: string;
    qq: number;
    rating: number;
    guest: boolean;
    under_monitor: boolean;
    under_solo: boolean;
    tier2: boolean;
    solo_until: Date;
    permission: BigInt;
    total_atc_time: number;
    total_pilot_time: number;
    register_time: Date;
}

type LoginForm = {
    username: string,
    password: string,
}

type LoginData = {
    user: UserModel;
    flush_token: string;
    token: string;
}

type FlushTokenData = LoginData

type UpdateUserProfileData = {
    username?: string,
    email?: string,
    email_code?: number,
    avatar_url?: string,
    qq?: number,
    origin_password?: string,
    new_password?: string
}

type RegisterData = {
    cid: number;
    email: string;
    email_code: string;
    password: string;
    confirmPassword: string;
    username: string;
    agreePrivacy: boolean;
}

type HistoryModel = {
    callsign: string;
    start_time: string;
    end_time: string;
    online_time: number;
}

type UserHistoryData = {
    total_pilot_time: number;
    total_atc_time: number;
    controllers: HistoryModel[];
    pilots: HistoryModel[];
}