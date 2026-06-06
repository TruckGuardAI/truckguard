import React, { useState } from 'react';

import {
View,
Text,
StyleSheet,
ScrollView,
Switch
} from 'react-native';

export default function ConfigScreen(){

const [notifications,setNotifications]=useState(true);

const [darkMode,setDarkMode]=useState(true);

const [community,setCommunity]=useState(true);

return(

<View style={styles.container}>

<ScrollView
showsVerticalScrollIndicator={false}
>

<Text style={styles.title}>
Configurações
</Text>

<Text style={styles.subtitle}>
Personalize sua experiência
</Text>

<View style={styles.card}>

<Text style={styles.section}>
Preferências
</Text>

<View style={styles.row}>

<Text style={styles.label}>
🔔 Notificações
</Text>

<Switch
value={notifications}
onValueChange={setNotifications}
/>

</View>

<View style={styles.row}>

<Text style={styles.label}>
🌙 Modo escuro
</Text>

<Switch
value={darkMode}
onValueChange={setDarkMode}
/>

</View>

<View style={styles.row}>

<Text style={styles.label}>
👥 Alertas da comunidade
</Text>

<Switch
value={community}
onValueChange={setCommunity}
/>

</View>

</View>

<View style={styles.card}>

<Text style={styles.section}>
Aplicativo
</Text>

<View style={styles.item}>
<Text style={styles.label}>
🌍 Idioma
</Text>

<Text style={styles.value}>
Português
</Text>

</View>

<View style={styles.item}>
<Text style={styles.label}>
📱 Versão
</Text>

<Text style={styles.value}>
1.0.0
</Text>

</View>

<View style={styles.item}>
<Text style={styles.label}>
ℹ Sobre
</Text>

<Text style={styles.value}>
TruckGuard
</Text>

</View>

</View>

</ScrollView>

</View>

)

}

const styles=StyleSheet.create({

container:{
flex:1,
backgroundColor:'#020617',
padding:20
},

title:{
fontSize:32,
fontWeight:'bold',
color:'#fff',
marginTop:50
},

subtitle:{
color:'#94a3b8',
marginBottom:25
},

card:{
backgroundColor:'#0f172a',
padding:20,
borderRadius:25,
marginBottom:20
},

section:{
fontSize:18,
fontWeight:'bold',
color:'#fff',
marginBottom:20
},

row:{
flexDirection:'row',
justifyContent:'space-between',
alignItems:'center',
marginBottom:25
},

item:{
flexDirection:'row',
justifyContent:'space-between',
marginBottom:25
},

label:{
fontSize:16,
color:'#fff'
},

value:{
color:'#94a3b8'
}

});