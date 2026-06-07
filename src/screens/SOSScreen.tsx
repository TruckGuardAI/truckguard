import React,{
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';

import {
  useSafeAreaInsets
} from 'react-native-safe-area-context';

import {
  Ionicons
} from '@expo/vector-icons';

import {
  useRouter
} from 'expo-router';

import * as Haptics from 'expo-haptics';

import { useTranslation } from 'react-i18next';

import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

import {
  truxafeShadows
} from '@/src/theme/shadows';

import type { AppThemeTokens } from '../theme/palettes';

import {
  alertsApiService,
} from '../services/alertsApi.service';

import {
  locationService,
  type UserCoordinates,
} from '../services/location.service';

import type {
  AlertType,
} from '../types/alert.types';

type SOSAlertPreset = {
  type: AlertType;
  title: string;
  description: string;
  createdLog: string;
};


export default function SOSScreen(){

const { t } = useTranslation();

const router=useRouter();

const insets=
useSafeAreaInsets();

const {width}=
useWindowDimensions();

const { theme } = useTheme();
const styles = useThemedStyles(createStyles);

const [loading,setLoading]=
useState(false);

const [coords,setCoords]=
useState<UserCoordinates | null>(
null
);

const [location,
setLocation]=useState(
t('sos.gettingGps')
);

const pulseAnim = useMemo(
  () => new Animated.Value(0),
  [],
);

const loadLocation = useCallback(
  async () => {
    try {
      const lastKnown =
        locationService
          .getLastKnownLocation();

      const loc =
        lastKnown ??
        await locationService
          .getCurrentLocation();

      setCoords(loc);

      setLocation(
        `${loc.latitude.toFixed(5)} ${loc.longitude.toFixed(5)}`,
      );
    } catch (error) {
      console.log(
        'Erro GPS:',
        error,
      );

      setCoords(null);

      setLocation(
        t('sos.locationError'),
      );
    }
  },
  [t],
);

useEffect(() => {
  const locationTimer = setTimeout(() => {
    void loadLocation();
  }, 0);

  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(
        pulseAnim,
        {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        },
      ),
      Animated.timing(
        pulseAnim,
        {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        },
      ),
    ]),
  );

  loop.start();

  return () => {
    clearTimeout(locationTimer);
    loop.stop();
  };
}, [loadLocation, pulseAnim]);


async function createSOSAlert(
preset:SOSAlertPreset
):Promise<void>{

if(!coords){

Alert.alert(
t('common.error'),
t('sos.gpsRequired')
);

return;

}

try{

setLoading(true);

const alert=

await alertsApiService
.createAlert({

type:
preset.type,

title:
preset.title,

latitude:
coords.latitude,

longitude:
coords.longitude,

});

if(!alert){

throw new Error(
'Falha ao criar alerta'
);

}

console.log(
preset.createdLog,
alert
);

Alert.alert(
t('sos.alertSent'),
t('sos.communityNotified')
);

router.push(
'/(tabs)/radar'
);

}catch(error){

console.log(
'Erro criar alerta SOS:',
error
);

Alert.alert(
t('common.error'),
t('sos.alertFailed')
);

}finally{

setLoading(
false
);

}

}


async function activateSOS(){

console.log(
'SOS_BUTTON_PRESSED'
);

if(
Platform.OS!==
'web'
){

await Haptics
.impactAsync(

Haptics
.ImpactFeedbackStyle
.Heavy

);

}

await createSOSAlert({

type:'sos',

title:
t('sos.presets.emergency'),

description:
'Pedido de emergência enviado',

createdLog:
'SOS_ALERT_CREATED',

});

}


const scale = useMemo(
  () =>
    pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.15],
    }),
  [pulseAnim],
);


const buttonSize=

Math.min(
180,
width*0.45
);


return(

<View
style={[

styles.container,

{
paddingTop:
insets.top+10
}

]}
>

<ScrollView
showsVerticalScrollIndicator={false}
>

<View
style={styles.card}
>

<Text
style={styles.label}
>

{t('sos.channel')}

</Text>

<Text
style={styles.location}
>

📍 {location}

</Text>

</View>

<View
style={styles.center}
>

<Animated.View

style={[

styles.halo,

{

width:
buttonSize+40,

height:
buttonSize+40,

borderRadius:
(buttonSize+40)/2,

transform:[

{
scale
}

]

}

]}

/>

<Pressable

onPress={
activateSOS
}

disabled={loading}

style={[

styles.sosButton,

{

width:
buttonSize,

height:
buttonSize,

borderRadius:
buttonSize/2

}

]}

>

{

loading?

<ActivityIndicator
color={theme.components.buttonPrimaryText}
/>

:

<>

<Text
style={
styles.sosText
}
>

{t('sos.title')}

</Text>

<Text
style={
styles.small
}
>

{t('sos.tapToSend')}

</Text>

</>

}

</Pressable>

</View>

<View
style={styles.grid}
>

<Pressable
style={styles.item}
disabled={loading}
onPress={()=>{
void createSOSAlert({

type:'fuel',

title:
t('sos.presets.fuelTheft'),

description:
t('sos.presets.fuelTheft'),

createdLog:
'FUEL_ALERT_CREATED',

});

}}
>

<Ionicons
name="flame-outline"
size={28}
color={theme.colors.danger}
/>

<Text
style={styles.itemText}
>

{t('sos.grid.fuelTheft')}

</Text>

</Pressable>

<Pressable
style={styles.item}
disabled={loading}
onPress={()=>{
void createSOSAlert({

type:'cargo_theft',

title:
t('sos.presets.cargoTheft'),

description:
t('sos.presets.cargoTheft'),

createdLog:
'CARGO_ALERT_CREATED',

});

}}
>

<Ionicons
name="cube-outline"
size={28}
color={theme.colors.danger}
/>

<Text
style={styles.itemText}
>

{t('sos.grid.cargoTheft')}

</Text>

</Pressable>

<Pressable
style={styles.item}
disabled={loading}
onPress={()=>{
void createSOSAlert({

type:'cabin_attack',

title:
t('sos.presets.cabinAttack'),

description:
t('sos.presets.cabinAttack'),

createdLog:
'CABIN_ALERT_CREATED',

});

}}
>

<Ionicons
name="car-outline"
size={28}
color={theme.colors.danger}
/>

<Text
style={styles.itemText}
>

{t('sos.grid.cabinAttack')}

</Text>

</Pressable>

<Pressable
style={styles.item}
disabled={loading}
onPress={()=>{
void createSOSAlert({

type:'pallet',

title:
t('sos.presets.palletTheft'),

description:
t('sos.presets.palletTheft'),

createdLog:
'PALLET_ALERT_CREATED',

});

}}
>

<Ionicons
name="layers-outline"
size={28}
color={theme.colors.danger}
/>

<Text
style={styles.itemText}
>

{t('sos.grid.palletTheft')}

</Text>

</Pressable>

</View>

</ScrollView>

</View>

);

}


function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({

container:{
flex:1,
backgroundColor:
colors.background,
padding:20
},

card:{
backgroundColor:
colors.surface,
padding:20,
borderRadius:20,
marginBottom:25,
...truxafeShadows.card
},

label:{
color:colors.danger,
fontWeight:'bold',
marginBottom:10
},

location:{
color:colors.textPrimary
},

center:{
alignItems:'center',
justifyContent:'center',
marginBottom:40
},

halo:{
position:'absolute',
borderWidth:2,
borderColor:colors.danger,
opacity:0.3
},

sosButton:{
backgroundColor:colors.danger,
justifyContent:'center',
alignItems:'center'
},

sosText:{
fontSize:42,
fontWeight:'bold',
color:components.buttonPrimaryText
},

small:{
color:components.buttonPrimaryText,
marginTop:10
},

grid:{
flexDirection:'row',
flexWrap:'wrap',
justifyContent:'space-between'
},

item:{
width:'48%',
backgroundColor:colors.card,
padding:20,
marginBottom:15,
borderRadius:15,
alignItems:'center'
},

itemText:{
color:colors.textPrimary,
marginTop:10,
textAlign:'center'
}

});
}