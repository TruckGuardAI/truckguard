import * as Location from 'expo-location';
import { Platform } from 'react-native';

const EARTH_RADIUS_KM = 6371;

export type UserCoordinates = {

  latitude: number;
  longitude: number;

};

type LocationListener = (
  coords: UserCoordinates,
) => void;

function toRadians(
  degrees: number,
): number {

  return (
    (degrees * Math.PI) / 180
  );

}

class LocationService {

  private watchSubscription:
    Location.LocationSubscription | null =
    null;

  private webWatchId:
    number | null =
    null;

  private readonly listeners =
    new Set<LocationListener>();

  private lastCoords:
    UserCoordinates | null =
    null;

  /*
   * DISTÂNCIA KM
   */
  calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {

    const dLat =
      toRadians(lat2 - lat1);

    const dLon =
      toRadians(lon2 - lon1);

    const lat1Rad =
      toRadians(lat1);

    const lat2Rad =
      toRadians(lat2);

    const haversine =

      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

      Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *

      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const centralAngle =

      2 *

      Math.atan2(

        Math.sqrt(haversine),

        Math.sqrt(
          1 - haversine,
        ),

      );

    const km =
      EARTH_RADIUS_KM *
      centralAngle;

    return (
      Math.round(km * 10) / 10
    );

  }

  /*
   * GPS WEB
   */
  private async getWebLocation():
  Promise<UserCoordinates> {

    return await new Promise<UserCoordinates>(
      (
        resolve,
        reject,
      ) => {

        if (
          !navigator.geolocation
        ) {

          reject(
            new Error(
              'Geolocation não suportado',
            ),
          );

          return;

        }

        navigator.geolocation
          .getCurrentPosition(

            (
              position,
            ) => {

              const coords = {

                latitude:
                  position.coords.latitude,

                longitude:
                  position.coords.longitude,

              };

              console.log(
                'GPS WEB OK:',
                coords,
              );

              resolve(coords);

            },

            (
              error,
            ) => {

              reject(error);

            },

            {

              enableHighAccuracy:
                true,

              timeout: 15000,

              maximumAge: 0,

            },

          );

      },
    );

  }

  /*
   * GPS MOBILE
   */
  private async getExpoLocation():
  Promise<UserCoordinates> {

    const permission =
      await Location
        .requestForegroundPermissionsAsync();

    console.log(
      'PERMISSION:',
      permission,
    );

    if (
      permission.status !==
      'granted'
    ) {

      throw new Error(
        'GPS negado',
      );

    }

    const position =
      await Location
        .getCurrentPositionAsync({

          accuracy:
            Location.Accuracy.High,

        });

    return {

      latitude:
        position.coords.latitude,

      longitude:
        position.coords.longitude,

    };

  }

  /*
   * LOCALIZAÇÃO ATUAL
   */
  async getCurrentLocation():
  Promise<UserCoordinates> {

    try {

      console.log(
        'PEGANDO LOCALIZAÇÃO...',
      );

      let coords:
        UserCoordinates;

      /*
       * WEB
       */
      if (
        Platform.OS === 'web'
      ) {

        coords =
          await this.getWebLocation();

      } else {

        /*
         * MOBILE
         */
        coords =
          await this.getExpoLocation();

      }

      this.lastCoords =
        coords;

      return coords;

    } catch (error) {

      console.log(
        'Erro getCurrentLocation:',
        error,
      );

      throw error;

    }

  }

  /*
   * ÚLTIMA LOCALIZAÇÃO
   */
  getLastKnownLocation():
  UserCoordinates | null {

    return this.lastCoords;

  }

  /*
   * WATCH USER
   */
  watchUserLocation(
    listener: LocationListener,
  ): () => void {

    this.listeners.add(
      listener,
    );

    /*
     * ENVIA ÚLTIMA
     */
    if (
      this.lastCoords
    ) {

      listener(
        this.lastCoords,
      );

    }

    void this.startWatching();

    return () => {

      this.listeners.delete(
        listener,
      );

      if (
        this.listeners.size === 0
      ) {

        this.stopWatching();

      }

    };

  }

  /*
   * START WATCH
   */
  private async startWatching():
  Promise<void> {

    /*
     * WEB
     */
    if (
      Platform.OS === 'web'
    ) {

      if (
        this.webWatchId !== null
      ) {

        return;

      }

      if (
        !navigator.geolocation
      ) {

        return;

      }

      this.webWatchId =

        navigator.geolocation
          .watchPosition(

            (
              position,
            ) => {

              const coords = {

                latitude:
                  position.coords.latitude,

                longitude:
                  position.coords.longitude,

              };

              console.log(
                'GPS WEB UPDATE:',
                coords,
              );

              this.lastCoords =
                coords;

              this.notifyListeners(
                coords,
              );

            },

            (
              error,
            ) => {

              console.log(
                'WEB WATCH ERROR:',
                error,
              );

            },

            {

              enableHighAccuracy:
                true,

              timeout: 15000,

              maximumAge: 0,

            },

          );

      return;

    }

    /*
     * MOBILE
     */
    if (
      this.watchSubscription
    ) {

      return;

    }

    try {

      const permission =
        await Location
          .requestForegroundPermissionsAsync();

      if (
        permission.status !==
        'granted'
      ) {

        console.log(
          'WATCH GPS NEGADO',
        );

        return;

      }

      this.watchSubscription =
        await Location
          .watchPositionAsync(

            {

              accuracy:
                Location.Accuracy.High,

              distanceInterval: 15,

              timeInterval: 3000,

            },

            (
              position,
            ) => {

              const coords = {

                latitude:
                  position.coords
                    .latitude,

                longitude:
                  position.coords
                    .longitude,

              };

              console.log(
                'GPS MOBILE UPDATE:',
                coords,
              );

              this.lastCoords =
                coords;

              this.notifyListeners(
                coords,
              );

            },

          );

    } catch (error) {

      console.log(
        'Erro watchUserLocation:',
        error,
      );

    }

  }

  /*
   * NOTIFICA LISTENERS
   */
  private notifyListeners(
    coords: UserCoordinates,
  ): void {

    this.listeners.forEach(
      (listener) => {

        listener(coords);

      },
    );

  }

  /*
   * STOP WATCH
   */
  stopWatching(): void {

    try {

      /*
       * MOBILE
       */
      if (
        this.watchSubscription
      ) {

        this.watchSubscription
          .remove();

        this.watchSubscription =
          null;

      }

      /*
       * WEB
       */
      if (
        this.webWatchId !== null
      ) {

        navigator.geolocation
          .clearWatch(
            this.webWatchId,
          );

        this.webWatchId =
          null;

      }

      this.listeners.clear();

    } catch (error) {

      console.log(
        'Erro stopWatching:',
        error,
      );

    }

  }

}

export const locationService =
  new LocationService();