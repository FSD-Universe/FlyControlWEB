const config = await (await fetch("/config.json")).json() as Config;
export const homeConfig = await (await fetch("/home.json")).json() as HomeConfig;
export const airports = await (await fetch("/data/airports.json")).json() as Airports;
export const facilities = await (await fetch("/data/facility.json")).json() as Facilities
export const privatePolicy = await (await fetch("/data/private-policy.md")).text();

export default config;
