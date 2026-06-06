import React from 'react';

import {
 Modal,
 View,
 Text,
 TouchableOpacity,
 StyleSheet
} from 'react-native';

type Props = {
 visible:boolean;
 onClose:()=>void;
 onSelect:(type:string)=>void;
};

const options=[
'Roubo',
'Acidente',
'Polícia',
'Combustível',
'Descanso',
'Perigo'
];

export default function CreateAlertModal({
 visible,
 onClose,
 onSelect
}:Props){

return(

<Modal
transparent
animationType="slide"
visible={visible}
>

<View style={styles.overlay}>

<View style={styles.modal}>

<Text style={styles.title}>
Reportar alerta
</Text>

{options.map(item=>(

<TouchableOpacity
key={item}
style={styles.item}
onPress={()=>onSelect(item)}
>

<Text style={styles.text}>
{item}
</Text>

</TouchableOpacity>

))}

<TouchableOpacity
onPress={onClose}
style={styles.cancel}
>

<Text
style={{
color:'#fff'
}}
>
Cancelar
</Text>

</TouchableOpacity>

</View>

</View>

</Modal>

)

}

const styles=StyleSheet.create({

overlay:{
flex:1,
backgroundColor:'rgba(0,0,0,.7)',
justifyContent:'center',
alignItems:'center'
},

modal:{
width:'85%',
backgroundColor:'#0f172a',
padding:20,
borderRadius:20
},

title:{
color:'#fff',
fontSize:22,
fontWeight:'bold',
marginBottom:20
},

item:{
backgroundColor:'#1e293b',
padding:16,
borderRadius:12,
marginBottom:10
},

text:{
color:'#fff'
},

cancel:{
marginTop:15,
backgroundColor:'#ef4444',
padding:15,
borderRadius:12,
alignItems:'center'
}

});