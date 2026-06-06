import React,{
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  ActivityIndicator,
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

import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import {
  truxafeColors
} from '@/src/theme/colors';

import {
  truxafeSpacing
} from '@/src/theme/spacing';

import {
  truxafeTypography
} from '@/src/theme/typography';

import {
  truxafeShadows
} from '@/src/theme/shadows';


export default function SOSScreen(){

const router=useRouter();

const insets=
useSafeAreaInsets();

const {width}=
useWindowDimensions();

const [loading,setLoading]=
useState(false);

const [location,
setLocation]=useState(
'Obtendo GPS...'
);

const pulse=
useRef(
new Animated.Value(0)
).current;


useEffect(()=>{

loadLocation();

Animated.loop(

Animated.sequence([

Animated.timing(
pulse,
{
toValue:1,
duration:1200,
useNativeDriver:true
}
),

Animated.timing(
pulse,
{
toValue:0,
duration:1200,
useNativeDriver:true
}
)

])

).start();

},[]);


async function loadLocation(){

try{

const permission=

await Location
.requestForegroundPermissionsAsync();

if(
permission.status!==
'granted'
){

setLocation(
'GPS desativado'
);

return;

}

const loc=

await Location
.getCurrentPositionAsync({

accuracy:
Location.Accuracy
.High

});

const latitude=

loc.coords.latitude;

const longitude=

loc.coords.longitude;

setLocation(

`${latitude.toFixed(5)}
${longitude.toFixed(5)}`

);

}catch(error){

console.log(
'Erro GPS:',
error
);

setLocation(
'Erro localização'
);

}

}


async function activateSOS(){

try{

setLoading(true);

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

router.push(
'/(tabs)/alerts'
);

}catch(error){

console.log(
'Erro SOS:',
error
);

}

finally{

setLoading(
false
);

}

}


const scale=

pulse.interpolate({

inputRange:[0,1],

outputRange:[
1,
1.15
]

});


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

CANAL EMERGÊNCIA

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
color="#fff"
/>

:

<>

<Text
style={
styles.sosText
}
>

SOS

</Text>

<Text
style={
styles.small
}
>

Toque para enviar

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
>

<Ionicons
name="flame-outline"
size={28}
color="#ff4d4d"
/>

<Text
style={styles.itemText}
>

Roubo combustível

</Text>

</Pressable>

<Pressable
style={styles.item}
>

<Ionicons
name="cube-outline"
size={28}
color="#ff4d4d"
/>

<Text
style={styles.itemText}
>

Roubo carga

</Text>

</Pressable>

<Pressable
style={styles.item}
>

<Ionicons
name="car-outline"
size={28}
color="#ff4d4d"
/>

<Text
style={styles.itemText}
>

Ataque cabine

</Text>

</Pressable>

<Pressable
style={styles.item}
>

<Ionicons
name="layers-outline"
size={28}
color="#ff4d4d"
/>

<Text
style={styles.itemText}
>

Roubo paletes

</Text>

</Pressable>

</View>

</ScrollView>

</View>

);

}


const styles=
StyleSheet.create({

container:{
flex:1,
backgroundColor:
truxafeColors.background,
padding:20
},

card:{
backgroundColor:
truxafeColors.surface,
padding:20,
borderRadius:20,
marginBottom:25,
...truxafeShadows.card
},

label:{
color:'#ff4d4d',
fontWeight:'bold',
marginBottom:10
},

location:{
color:'#fff'
},

center:{
alignItems:'center',
justifyContent:'center',
marginBottom:40
},

halo:{
position:'absolute',
borderWidth:2,
borderColor:'#ff4d4d',
opacity:0.3
},

sosButton:{
backgroundColor:'#b91c1c',
justifyContent:'center',
alignItems:'center'
},

sosText:{
fontSize:42,
fontWeight:'bold',
color:'#fff'
},

small:{
color:'#fff',
marginTop:10
},

grid:{
flexDirection:'row',
flexWrap:'wrap',
justifyContent:'space-between'
},

item:{
width:'48%',
backgroundColor:'#0f172a',
padding:20,
marginBottom:15,
borderRadius:15,
alignItems:'center'
},

itemText:{
color:'#fff',
marginTop:10,
textAlign:'center'
}

});