import React, {
    useState,
  } from 'react';
  
  import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
  } from 'react-native';
  
  import {
    router,
  } from 'expo-router';
  
  import GradientBackground from '../components/ui/GradientBackground';
  
  import {
    supabase,
  } from '../src/lib/supabase';
  
  export default function RegisterScreen() {
  
    const [
      name,
      setName,
    ] = useState('');
  
    const [
      email,
      setEmail,
    ] = useState('');
  
    const [
      password,
      setPassword,
    ] = useState('');
  
    const [
      confirmPassword,
      setConfirmPassword,
    ] = useState('');
  
    const [
      loading,
      setLoading,
    ] = useState(false);
  
    /*
     * CRIAR CONTA
     */
    async function handleRegister() {
  
      try {
  
        if (
          !name ||
          !email ||
          !password ||
          !confirmPassword
        ) {
  
          Alert.alert(
            'Erro',
            'Preencha todos os campos'
          );
  
          return;
  
        }
  
        if (
          password !==
          confirmPassword
        ) {
  
          Alert.alert(
            'Erro',
            'As senhas não coincidem'
          );
  
          return;
  
        }
  
        if (
          password.length < 6
        ) {
  
          Alert.alert(
            'Erro',
            'Senha muito curta'
          );
  
          return;
  
        }
  
        setLoading(true);
  
        const {
          data,
          error,
        } =
          await supabase.auth.signUp({
  
            email,
  
            password,
  
            options: {
  
              data: {
  
                full_name: name,
  
              },
  
            },
  
          });
  
        if (error) {
  
          throw error;
  
        }
  
        console.log(
          'USUÁRIO:',
          data
        );
  
        Alert.alert(
          'Conta criada',
          'Cadastro realizado com sucesso'
        );
  
        router.replace(
          '/login'
        );
  
      } catch (error: any) {
  
        console.log(
          'Erro cadastro:',
          error
        );
  
        Alert.alert(
          'Erro',
          error.message ||
          'Falha ao criar conta'
        );
  
      } finally {
  
        setLoading(false);
  
      }
  
    }
  
    return (
  
      <GradientBackground>
  
        <View style={styles.container}>
  
          <Text style={styles.logo}>
            TRUXAFE
          </Text>
  
          <Text style={styles.title}>
            Criar conta
          </Text>
  
          <TextInput
            placeholder="Nome"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
  
          <TextInput
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
  
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
  
          <TextInput
            placeholder="Confirmar senha"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
  
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
  
            <Text style={styles.buttonText}>
  
              {
                loading
                  ? 'Criando conta...'
                  : 'Criar conta'
              }
  
            </Text>
  
          </TouchableOpacity>
  
          <TouchableOpacity
            onPress={() =>
              router.replace('/login')
            }
          >
  
            <Text style={styles.loginText}>
              Já possui conta? Entrar
            </Text>
  
          </TouchableOpacity>
  
        </View>
  
      </GradientBackground>
  
    );
  
  }
  
  const styles = StyleSheet.create({
  
    container: {
  
      flex: 1,
  
      justifyContent: 'center',
  
      paddingHorizontal: 28,
  
    },
  
    logo: {
  
      fontSize: 42,
  
      fontWeight: '900',
  
      color: '#ffffff',
  
      marginBottom: 20,
  
      letterSpacing: 4,
  
    },
  
    title: {
  
      color: '#ffffff',
  
      fontSize: 28,
  
      fontWeight: '800',
  
      marginBottom: 40,
  
    },
  
    input: {
  
      backgroundColor: '#0f172a',
  
      color: '#ffffff',
  
      paddingVertical: 16,
  
      paddingHorizontal: 18,
  
      borderRadius: 14,
  
      marginBottom: 16,
  
      borderWidth: 1,
  
      borderColor: '#1e293b',
  
    },
  
    button: {
  
      backgroundColor: '#f97316',
  
      paddingVertical: 18,
  
      borderRadius: 16,
  
      alignItems: 'center',
  
      marginTop: 10,
  
    },
  
    buttonText: {
  
      color: '#ffffff',
  
      fontWeight: '800',
  
      fontSize: 16,
  
    },
  
    loginText: {
  
      color: '#94a3b8',
  
      textAlign: 'center',
  
      marginTop: 26,
  
    },
  
  });