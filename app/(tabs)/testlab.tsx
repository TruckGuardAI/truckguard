import React,{
    useState
    } from 'react';
    
    import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
    } from 'react-native';
    
    import {
    securityService
    } from '../../src/services/security.service';
    
    export default function TestLab(){
    
    const[
    state,
    setState
    ]=useState(
    
    securityService
    .getState()
    
    );
    
    async function simulate(
    
    sensor:any
    
    ){
    
    const data=
    
    await securityService
    .simulateEvent(
    sensor
    );
    
    setState(
    {...data}
    );
    
    }
    
    function reset(){
    
    const data=
    
    securityService
    .reset();
    
    setState(
    {...data}
    );
    
    }
    
    return(
    
    <View
    style={styles.container}
    >
    
    <Text
    style={styles.title}
    >
    
    TruckGuard Test Lab
    
    </Text>
    
    <Text
    style={styles.status}
    >
    
    Sirene:
    
    {
    
    state.alarm
    
    ?
    
    ' 🚨 ON'
    
    :
    
    ' 🟢 OFF'
    
    }
    
    </Text>
    
    <Text
    style={styles.event}
    >
    
    {
    
    state.lastEvent||
    
    'Sem eventos'
    
    }
    
    </Text>
    
    <TouchableOpacity
    style={styles.button}
    onPress={()=>
    simulate(
    'tankLeft'
    )
    }
    >
    
    <Text>
    Simular tanque esquerdo
    </Text>
    
    </TouchableOpacity>
    
    <TouchableOpacity
    style={styles.button}
    onPress={()=>
    simulate(
    'tankRight'
    )
    }
    >
    
    <Text>
    Simular tanque direito
    </Text>
    
    </TouchableOpacity>
    
    <TouchableOpacity
    style={styles.button}
    onPress={()=>
    simulate(
    'palletLeft'
    )
    }
    >
    
    <Text>
    Simular palete esquerdo
    </Text>
    
    </TouchableOpacity>
    
    <TouchableOpacity
    style={styles.button}
    onPress={()=>
    simulate(
    'palletRight'
    )
    }
    >
    
    <Text>
    Simular palete direito
    </Text>
    
    </TouchableOpacity>
    
    <TouchableOpacity
    style={styles.alertButton}
    onPress={()=>
    simulate(
    'all'
    )
    }
    >
    
    <Text
    style={{
    color:'#fff'
    }}
    >
    
    Ataque completo
    
    </Text>
    
    </TouchableOpacity>
    
    <TouchableOpacity
    style={styles.reset}
    onPress={
    reset
    }
    >
    
    <Text>
    
    Resetar
    
    </Text>
    
    </TouchableOpacity>
    
    </View>
    
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
    fontSize:30,
    fontWeight:'bold',
    color:'#fff',
    marginTop:50
    },
    
    status:{
    color:'#fff',
    marginTop:20,
    fontSize:20
    },
    
    event:{
    color:'#f97316',
    marginTop:10,
    marginBottom:30
    },
    
    button:{
    padding:15,
    backgroundColor:'#0f172a',
    borderRadius:15,
    marginBottom:15
    },
    
    alertButton:{
    padding:15,
    backgroundColor:'#dc2626',
    borderRadius:15,
    marginBottom:15,
    alignItems:'center'
    },
    
    reset:{
    padding:15,
    backgroundColor:'#94a3b8',
    borderRadius:15,
    alignItems:'center'
    }
    
    });