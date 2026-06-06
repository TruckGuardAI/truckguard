import {
  Alert,
  Linking,
} from 'react-native';

function buildGoogleMapsUrl(
  latitude: number,
  longitude: number,
): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function buildWazeUrl(
  latitude: number,
  longitude: number,
): string {
  return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
}

class NavigationService {
  private async openUrl(url: string): Promise<void> {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('NAV_ERROR', error);

      console.log(
        'Erro navegação:',
        error,
      );

      Alert.alert(
        'Erro',
        'Não foi possível abrir a navegação.',
      );
    }
  }

  async openGoogleMaps(
    latitude: number,
    longitude: number,
  ): Promise<void> {
    await this.openUrl(
      buildGoogleMapsUrl(
        latitude,
        longitude,
      ),
    );
  }

  async openWaze(
    latitude: number,
    longitude: number,
  ): Promise<void> {
    await this.openUrl(
      buildWazeUrl(
        latitude,
        longitude,
      ),
    );
  }
}

export const navigationService =
  new NavigationService();
