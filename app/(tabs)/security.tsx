import React,{
    useState
    } from 'react';
    
    import{
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
    } from 'react-native';
    
    import{
    MaterialIcons
    } from '@expo/vector-icons';
    
    import{
    securityService
    } from '../../src/services/security.service';
    
    export default function SecurityScreen(){
    
    const[
    connected,
    setConnected
    ]=useState(false);
    
    const[
    state,
    setState
    ]=useState(
    securityService.getState()
    );
    
    function connectESP(){
    
    setConnected(
    !connected
    );
    
    }
    
    async function triggerSensor(
    
    sensor:
    'tankRight'|
    'tankLeft'|
    'palletRight'|
    'palletLeft'
    
    ){
    
    await securityService
    .simulateEvent(
    sensor
    );
    
    setState({
    
    ...securityService
    .getState()
    
    });
    
    }
    
    function resetSystem(){
    
    securityService
    .reset();
    
    setState({
    
    ...securityService
    .getState()
    
    });
    
    }
    
    const sensors=[
    
    {
    name:'Tanque Direito',
    key:'tankRight',
    status:!state.tankRight
    },
    
    {
    name:'Tanque Esquerdo',
    key:'tankLeft',
    status:!state.tankLeft
    },
    
    {
    name:'Palete Direito',
    key:'palletRight',
    status:!state.palletRight
    },
    
    {
    name:'Palete Esquerdo',
    key:'palletLeft',
    status:!state.palletLeft
    }
    
    ];
    
    return(
    
    <ScrollView
    style={styles.container}
    showsVerticalScrollIndicator={false}
    >
    
    <Text style={styles.title}>
    TruckGuard Security
    </Text>
    
    <View style={styles.card}>
    
    <Text style={styles.label}>
    ESP32
    </Text>
    
    <Text
    style={[
    
    styles.status,
    
    {
    
    color:
    
    connected
    
    ?
    
    '#22c55e'
    
    :
    
    '#ef4444'
    
    }
    
    ]}
    
    >
    
    {
    
    connected
    
    ?
    
    '🟢 Conectado'
    
    :
    
    '🔴 Desconectado'
    
    }
    
    </Text>
    
    </View>
    
    <Text style={styles.section}>
    Sensores
    </Text>
    
    {
    
    sensors.map(
    (item,index)=>(
    
    <TouchableOpacity
    
    key={index}
    
    style={[
    
    styles.sensorCard,
    
    !item.status&&{
    
    borderWidth:2,
    borderColor:'#ef4444'
    
    }
    
    ]}
    
    onPress={()=>triggerSensor(
    item.key as any
    )}
    
    >
    
    <Text
    style={styles.sensorName}
    >
    
    {item.name}
    
    </Text>
    
    <Text
    style={{
    
    color:
    
    item.status
    
    ?
    
    '#22c55e'
    
    :
    
    '#ef4444'
    
    }}
    
    >
    
    {
    
    item.status
    
    ?
    
    '🟢 Seguro'
    
    :
    
    '🚨 ALERTA'
    
    }
    
    </Text>
    
    </TouchableOpacity>
    
    )
    
    )
    
    }
    
    <View style={styles.card}>
    
    <Text style={styles.label}>
    Sirene
    </Text>
    
    <Text style={styles.status}>
    
    {
    
    state.alarm
    
    ?
    
    '🚨 ATIVA'
    
    :
    
    '⚪ Offline'
    
    }
    
    </Text>
    
    </View>
    
    <TouchableOpacity
    style={styles.button}
    onPress={connectESP}
    >
    
    <MaterialIcons
    name="bluetooth"
    size={25}
    color="#fff"
    />
    
    <Text style={styles.buttonText}>
    
    {
    
    connected
    
    ?
    
    'Desconectar'
    
    :
    
    'Procurar ESP32'
    
    }
    
    </Text>
    
    </TouchableOpacity>
    
    <TouchableOpacity
    style={styles.resetButton}
    onPress={resetSystem}
    >
    
    <Text style={styles.buttonText}>
    Reset Sistema
    </Text>
    
    </TouchableOpacity>
    
    </ScrollView>
    
    );
    
    }
    
    const styles=
    StyleSheet.create({
    
    container:{
    flex:1,
    padding:20,
    backgroundColor:'#020617'
    },
    
    title:{
    fontSize:32,
    fontWeight:'bold',
    color:'#fff',
    marginTop:50,
    marginBottom:25
    },
    
    section:{
    fontSize:22,
    fontWeight:'bold',
    color:'#fff',
    marginBottom:15
    },
    
    card:{
    backgroundColor:'#0f172a',
    padding:20,
    borderRadius:20,
    marginBottom:20
    },
    
    label:{
    color:'#94a3b8'
    },
    
    status:{
    marginTop:10,
    fontSize:18,
    fontWeight:'bold'
    },
    
    sensorCard:{
    backgroundColor:'#0f172a',
    padding:20,
    borderRadius:20,
    marginBottom:15,
    flexDirection:'row',
    justifyContent:'space-between'
    },
    
    sensorName:{
    color:'#fff',
    fontSize:16
    },
    
    button:{
    height:60,
    backgroundColor:'#f97316',
    borderRadius:20,
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row',
    marginTop:20
    },
    
    resetButton:{
    height:60,
    backgroundColor:'#dc2626',
    borderRadius:20,
    justifyContent:'center',
    alignItems:'center',
    marginTop:15,
    marginBottom:100
    },
    
    buttonText:{
    marginLeft:10,
    color:'#fff',
    fontWeight:'bold',
    fontSize:16
    }
    
    });