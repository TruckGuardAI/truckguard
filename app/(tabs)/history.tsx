import React,{
    useCallback,
    useState
    } from 'react';
    
    import{
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
    } from 'react-native';
    
    import{
    useFocusEffect
    } from 'expo-router';
    
    import{
    historyService
    } from '../../src/services/history.service';
    
    type SecurityEvent={
    
    id:string;
    
    type:
    'fuel'|
    'pallet'|
    'full_attack';
    
    sensor:string;
    
    time:string;
    
    siren:boolean;
    
    communitySent:boolean;
    
    location?:string;
    
    };
    
    export default function HistoryScreen(){
    
    const[
    events,
    setEvents
    ]=useState<SecurityEvent[]>([]);
    
    useFocusEffect(
    
    useCallback(()=>{
    
    loadEvents();
    
    },[])
    
    );
    
    function loadEvents():void{
    
    try{
    
    const data=
    historyService.getAll();
    
    setEvents(
    [...data]
    );
    
    }
    catch(error){
    
    console.log(
    'Erro carregar histórico:',
    error
    );
    
    }
    
    }
    
    function clearHistory():void{
    
    try{
    
    historyService.clear();
    
    setEvents([]);
    
    }
    catch(error){
    
    console.log(
    'Erro limpar:',
    error
    );
    
    }
    
    }
    
    return(
    
    <View style={styles.container}>
    
    <Text style={styles.title}>
    Histórico
    </Text>
    
    {
    
    events.length===0
    
    ?
    
    <View style={styles.emptyContainer}>
    
    <Text style={styles.emptyText}>
    Nenhum evento encontrado
    </Text>
    
    </View>
    
    :
    
    <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{
    paddingBottom:120
    }}
    >
    
    {
    
    events.map(item=>(
    
    <View
    key={item.id}
    style={styles.card}
    >
    
    <Text style={styles.eventTitle}>
    🚨 {item.sensor}
    </Text>
    
    <Text style={styles.time}>
    🕒 {item.time}
    </Text>
    
    <Text style={styles.info}>
    Sirene:
    {item.siren ? ' ON' : ' OFF'}
    </Text>
    
    <Text style={styles.info}>
    Comunidade:
    {item.communitySent
    ? ' Enviado'
    : ' Não enviado'}
    </Text>
    
    </View>
    
    ))
    
    }
    
    </ScrollView>
    
    }
    
    <TouchableOpacity
    style={styles.clearButton}
    onPress={clearHistory}
    >
    
    <Text style={styles.buttonText}>
    Limpar histórico
    </Text>
    
    </TouchableOpacity>
    
    </View>
    
    );
    
    }
    
    const styles=StyleSheet.create({
    
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
    
    emptyContainer:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
    },
    
    emptyText:{
    color:'#94a3b8',
    fontSize:16
    },
    
    card:{
    backgroundColor:'#0f172a',
    padding:20,
    borderRadius:20,
    marginBottom:15
    },
    
    eventTitle:{
    fontSize:18,
    fontWeight:'bold',
    color:'#fff'
    },
    
    time:{
    marginTop:8,
    color:'#f97316'
    },
    
    info:{
    marginTop:5,
    color:'#94a3b8'
    },
    
    clearButton:{
    height:55,
    backgroundColor:'#dc2626',
    borderRadius:15,
    justifyContent:'center',
    alignItems:'center',
    marginTop:15
    },
    
    buttonText:{
    fontWeight:'bold',
    color:'#fff'
    }
    
    });