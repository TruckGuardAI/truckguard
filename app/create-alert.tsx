import React, {
  useState,
} from 'react';

import {
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
} from 'expo-router';

  import {
    supabase,
  } from '../src/lib/supabase';

import {
  useAuth,
} from '../src/context/AuthContext';

import {
  locationService,
} from '../src/services/location.service';

const alertTypes = [

  '🚨 Tentativa de roubo',

  '👤 Atividade suspeita',

  '🚧 Acidente',

  '⚠️ Estrada perigosa',

  '🛌 Área segura',

  '🔧 Oficina',

  '🆘 Pedido de ajuda',

];

export default function CreateAlert():
React.ReactElement {

  const {
    user,
  } = useAuth();

  const [
    selected,
    setSelected,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  /*
   * SALVAR ALERTA
   */
  async function saveAlert() {

    try {

      /*
       * LOGIN
       */
      if (!user) {

        Alert.alert(
          'Erro',
          'Faça login primeiro',
        );

        return;

      }

      /*
       * VALIDAÇÃO
       */
      if (!selected) {

        Alert.alert(
          'Atenção',
          'Escolha um alerta',
        );

        return;

      }

      setLoading(true);

      /*
       * GPS REAL
       */
      const location =

        await locationService
          .getCurrentLocation();

      /*
       * GPS FALHOU
       */
      if (!location) {

        Alert.alert(
          'Erro',
          'GPS não disponível',
        );

        return;

      }

      console.log(
        'LOCALIZAÇÃO ALERTA:',
        location,
      );

      /*
       * INSERT SUPABASE
       */
      const {
        error,
      } =

        await supabase
          .from('alerts')
          .insert({

            title:
              selected,

            description,

            latitude:
              location.latitude,

            longitude:
              location.longitude,

            risk_level:
              'medium',

            user_id:
              user.id,

          });

      if (error) {

        throw error;

      }

      Alert.alert(
        'Sucesso',
        'Alerta criado',
      );

      /*
       * LIMPA FORM
       */
      setDescription('');

      setSelected('');

      /*
       * VOLTA RADAR
       */
      router.back();

    } catch (error: any) {

      console.log(
        'Erro criar alerta:',
        error,
      );

      Alert.alert(

        'Erro',

        error?.message ||

        'Falha ao criar alerta',

      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <ScrollView

      style={styles.container}

      contentContainerStyle={
        styles.content
      }

      showsVerticalScrollIndicator={
        false
      }

    >

      <Text style={styles.title}>
        Novo alerta
      </Text>

      <Text style={styles.subtitle}>
        Selecione o tipo
      </Text>

      {

        alertTypes.map((item) => (

          <TouchableOpacity

            key={item}

            style={[

              styles.card,

              selected === item &&

              styles.selected,

            ]}

            onPress={() => {

              setSelected(item);

            }}

            activeOpacity={0.8}

          >

            <Text style={styles.text}>
              {item}
            </Text>

          </TouchableOpacity>

        ))

      }

      <TextInput

        placeholder="Descrição opcional"

        placeholderTextColor="#64748b"

        style={[

          styles.input,

          styles.textArea,

        ]}

        multiline

        value={description}

        onChangeText={
          setDescription
        }

      />

      <TouchableOpacity

        style={styles.button}

        onPress={saveAlert}

        disabled={loading}

        activeOpacity={0.8}

      >

        {

          loading

            ? (

              <ActivityIndicator
                color="#ffffff"
              />

            )

            : (

              <Text
                style={
                  styles.buttonText
                }
              >

                Salvar alerta

              </Text>

            )

        }

      </TouchableOpacity>

    </ScrollView>

  );

}

const styles =

StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor:
      '#020617',

  },

  content: {

    padding: 20,

    paddingTop: 70,

    paddingBottom: 120,

  },

  title: {

    fontSize: 30,

    fontWeight: 'bold',

    color: '#fff',

    marginBottom: 10,

  },

  subtitle: {

    color: '#94a3b8',

    marginBottom: 20,

    fontSize: 15,

  },

  card: {

    backgroundColor:
      '#0f172a',

    padding: 18,

    borderRadius: 20,

    marginBottom: 12,

    borderWidth: 1,

    borderColor:
      '#1e293b',

  },

  selected: {

    borderWidth: 2,

    borderColor:
      '#f97316',

    backgroundColor:
      '#1e293b',

  },

  text: {

    color: '#fff',

    fontSize: 15,

    fontWeight: '600',

  },

  input: {

    backgroundColor:
      '#0f172a',

    marginTop: 20,

    padding: 15,

    borderRadius: 20,

    color: '#fff',

    borderWidth: 1,

    borderColor:
      '#1e293b',

  },

  textArea: {

    height: 120,

    textAlignVertical:
      'top',

  },

  button: {

    backgroundColor:
      '#f97316',

    padding: 18,

    borderRadius: 20,

    marginTop: 24,

    alignItems: 'center',

    justifyContent: 'center',

    minHeight: 58,

  },

  buttonText: {

    color: '#fff',

    fontWeight: 'bold',

    textAlign: 'center',

    fontSize: 16,

  },

});