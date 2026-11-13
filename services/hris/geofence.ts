export type BranchGeofence = {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

const EARTH_RADIUS_METERS = 6_371_000;
const MAX_GPS_ACCURACY_METERS = 100;


function distanceMeters(a: GeoPoint, b: { latitude: number; longitude: number }) {
  const latitudeDelta = ((b.latitude - a.latitude) * Math.PI) / 180;
  const longitudeDelta = ((b.longitude - a.longitude) * Math.PI) / 180;
  const latitudeA = (a.latitude * Math.PI) / 180;
  const latitudeB = (b.latitude * Math.PI) / 180;
  const sinLatitude = Math.sin(latitudeDelta / 2);
  const sinLongitude = Math.sin(longitudeDelta / 2);
  const haversine =
    sinLatitude * sinLatitude +
    Math.cos(latitudeA) * Math.cos(latitudeB) * sinLongitude * sinLongitude;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function isWithinGeofence(branch: BranchGeofence, point: GeoPoint): boolean {
  if (
    branch.latitude === null ||
    branch.longitude === null ||
    branch.radiusMeters === null ||
    branch.radiusMeters <= 0 ||
    !Number.isFinite(branch.latitude) ||
    branch.latitude < -90 ||
    branch.latitude > 90 ||
    !Number.isFinite(branch.longitude) ||
    branch.longitude < -180 ||
    branch.longitude > 180 ||
    !Number.isFinite(point.latitude) ||
    point.latitude < -90 ||
    point.latitude > 90 ||
    !Number.isFinite(point.longitude) ||
    point.longitude < -180 ||
    point.longitude > 180 ||
    !Number.isFinite(point.accuracy) ||
    point.accuracy < 0 ||
    point.accuracy > MAX_GPS_ACCURACY_METERS
  ) {
    return false;
  }

  const { latitude, longitude, radiusMeters } = branch;
  return (
    distanceMeters(point, { latitude, longitude }) <= radiusMeters + 1e-6
  );
}
