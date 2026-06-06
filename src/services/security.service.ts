import type { AlertType } from '../types/alert.types';

import { alertsApiService } from './alertsApi.service';

import {
  locationService,
} from './location.service';

import {
  historyService
} from './history.service';

import {
  notificationsService
} from './notifications.service';

type SensorState = {

  tankRight:boolean;
  tankLeft:boolean;

  palletRight:boolean;
  palletLeft:boolean;

  alarm:boolean;

  lastEvent:string | null;

};

export type SensorType =

'tankRight' |
'tankLeft' |
'palletRight' |
'palletLeft' |
'all';

class SecurityService{

  private state:SensorState={

    tankRight:false,
    tankLeft:false,

    palletRight:false,
    palletLeft:false,

    alarm:false,

    lastEvent:null

  };

  getState():SensorState{

    return{

      ...this.state

    };

  }

  async simulateEvent(
    sensor:SensorType
  ):Promise<SensorState>{

    try{

      const sensorName:string=

      this.getSensorName(
        sensor
      );

      if(
        sensor==='all'
      ){

        this.state={

          tankRight:true,
          tankLeft:true,

          palletRight:true,
          palletLeft:true,

          alarm:true,

          lastEvent:
          '🚨 Ataque completo'

        };

      }else{

        this.state={

          ...this.state,

          [sensor]:true,

          alarm:true,

          lastEvent:
          `🚨 ${sensorName}`

        };

      }

      const eventType=

      sensor==='tankRight' ||
      sensor==='tankLeft'

      ?

      'fuel'

      :

      sensor==='palletRight' ||
      sensor==='palletLeft'

      ?

      'pallet'

      :

      'full_attack';

      historyService.add({

        type:
        eventType,

        sensor:
        sensorName,

        time:
        new Date()
        .toLocaleTimeString(),

        siren:true,

        communitySent:true

      });

      await notificationsService.send(

        '🚨 TruckGuard',

        `Alerta detectado: ${sensorName}`

      );

      await this.createCommunityAlert(
        sensorName,
        eventType
      );

      console.log(

        '🚨 Fluxo executado:',

        sensorName

      );

      return{

        ...this.state

      };

    }
    catch(error){

      console.log(

        'Erro Security:',

        error

      );

      return{

        ...this.state

      };

    }

  }

  private async createCommunityAlert(
    sensorName:string,
    type:AlertType
  ):Promise<void>{

    try{

      const currentLocation =
        await locationService
          .getCurrentLocation();

      if (
        !Number.isFinite(currentLocation.latitude) ||
        !Number.isFinite(currentLocation.longitude)
      ) {
        console.log(
          'GPS inválido. Alerta não enviado.'
        );

        return;
      }

      console.log(

        '📍 GPS:',

        currentLocation.latitude,

        currentLocation.longitude

      );

      await alertsApiService.createAlert({

        title:sensorName,

        type,

        latitude:
        currentLocation.latitude,

        longitude:
        currentLocation.longitude,

      });

    }
    catch(error){

      console.log(

        'GPS indisponível. Alerta cancelado.',

        error

      );

      return;

    }

  }

  private getSensorName(
    sensor:SensorType
  ):string{

    const names:Record<
      SensorType,
      string
    >={

      tankRight:
      'Tanque Direito',

      tankLeft:
      'Tanque Esquerdo',

      palletRight:
      'Palete Direito',

      palletLeft:
      'Palete Esquerdo',

      all:
      'Ataque Completo'

    };

    return names[
      sensor
    ];

  }

  reset():SensorState{

    try{

      this.state={

        tankRight:false,
        tankLeft:false,

        palletRight:false,
        palletLeft:false,

        alarm:false,

        lastEvent:null

      };

      console.log(
        'Sistema resetado'
      );

      return{

        ...this.state

      };

    }
    catch(error){

      console.log(

        'Erro reset:',

        error

      );

      return{

        ...this.state

      };

    }

  }

}

export const securityService=
new SecurityService();
