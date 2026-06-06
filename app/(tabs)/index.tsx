import React from 'react';

import {
View,
Text,
StyleSheet,
TouchableOpacity,
ScrollView
} from 'react-native';

import {
MaterialIcons
} from '@expo/vector-icons';

export default function HomeScreen() {

return (

<View style={styles.wrapper}>

<ScrollView
style={styles.container}
showsVerticalScrollIndicator={false}
>

<View style={styles.header}>

<Text style={styles.greeting}>
Olá João 👋
</Text>

<Text style={styles.subtitle}>
Motorista profissional
</Text>

</View>

<View style={styles.statusCard}>

<View>

<Text style={styles.statusLabel}>
Status atual
</Text>

<Text style={styles.safe}>
🟢 Seguro
</Text>

<Text style={styles.small}>
Tudo tranquilo na rota
</Text>

</View>

<MaterialIcons
name="security"
size={45}
color="#22c55e"
/>

</View>

<Text style={styles.section}>
Alertas próximos
</Text>

<View style={styles.alertCard}>

<Text style={styles.alertTitle}>
🚨 Tentativa de roubo
</Text>

<Text style={styles.alertText}>
📍 4 km • ⏱ há 18 min
</Text>

</View>

<View style={styles.alertCard}>

<Text style={styles.alertTitle}>
⚠️ Estrada perigosa
</Text>

<Text style={styles.alertText}>
📍 8 km • ⏱ há 35 min
</Text>

</View>

<Text style={styles.section}>
Ações rápidas
</Text>

<View style={styles.actionsContainer}>

<TouchableOpacity style={styles.action}>

<MaterialIcons
name="warning"
size={30}
color="#ef4444"
/>

<Text style={styles.actionText}>
SOS
</Text>

</TouchableOpacity>

<TouchableOpacity style={styles.action}>

<MaterialIcons
name="map"
size={30}
color="#f97316"
/>

<Text style={styles.actionText}>
Mapa
</Text>

</TouchableOpacity>

<TouchableOpacity style={styles.action}>

<MaterialIcons
name="report-problem"
size={30}
color="#facc15"
/>

<Text style={styles.actionText}>
Reportar
</Text>

</TouchableOpacity>

<TouchableOpacity style={styles.action}>

<MaterialIcons
name="history"
size={30}
color="#3b82f6"
/>

<Text style={styles.actionText}>
Histórico
</Text>

</TouchableOpacity>

</View>

<Text style={styles.section}>
Resumo
</Text>

<View style={styles.summary}>

<View style={styles.summaryCard}>

<Text style={styles.number}>
4
</Text>

<Text style={styles.summaryText}>
Alertas hoje
</Text>

</View>

<View style={styles.summaryCard}>

<Text style={styles.number}>
3
</Text>

<Text style={styles.summaryText}>
Confirmados
</Text>

</View>

<View style={styles.summaryCard}>

<Text style={styles.number}>
1
</Text>

<Text style={styles.summaryText}>
Ajudas
</Text>

</View>

</View>

</ScrollView>

</View>

);

}

const styles = StyleSheet.create({

wrapper:{
flex:1,
alignItems:'center',
backgroundColor:'#020617'
},

container:{
width:'100%',
maxWidth:480,
backgroundColor:'#020617',
padding:20
},

header:{
marginTop:50,
marginBottom:25
},

greeting:{
fontSize:32,
fontWeight:'bold',
color:'#fff'
},

subtitle:{
fontSize:15,
color:'#94a3b8'
},

statusCard:{
backgroundColor:'#0f172a',
padding:20,
borderRadius:20,
marginBottom:25,
flexDirection:'row',
justifyContent:'space-between',
alignItems:'center'
},

statusLabel:{
color:'#94a3b8'
},

safe:{
fontSize:22,
fontWeight:'bold',
color:'#22c55e',
marginTop:5
},

small:{
color:'#64748b'
},

section:{
fontSize:22,
fontWeight:'bold',
color:'#fff',
marginBottom:15
},

alertCard:{
backgroundColor:'#0f172a',
padding:18,
borderRadius:15,
marginBottom:15
},

alertTitle:{
color:'#fff',
fontSize:16,
fontWeight:'600'
},

alertText:{
color:'#94a3b8',
marginTop:8
},

actionsContainer:{
flexDirection:'row',
flexWrap:'wrap',
justifyContent:'space-between',
marginBottom:30
},

action:{
backgroundColor:'#0f172a',
width:'48%',
height:90,
marginBottom:15,
borderRadius:20,
justifyContent:'center',
alignItems:'center'
},

actionText:{
color:'#fff',
fontSize:12,
marginTop:8
},

summary:{
flexDirection:'row',
justifyContent:'space-between',
marginBottom:60
},

summaryCard:{
backgroundColor:'#0f172a',
width:'30%',
padding:20,
borderRadius:15,
alignItems:'center'
},

number:{
fontSize:25,
fontWeight:'bold',
color:'#f97316'
},

summaryText:{
color:'#94a3b8',
fontSize:12,
textAlign:'center',
marginTop:8
}

});