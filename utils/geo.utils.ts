import * as Location from 'expo-location';

export const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });
    if (result.length > 0) {
      return result[0];
    }
  } catch (e) {
    console.error(e);
   return null;
  }
};