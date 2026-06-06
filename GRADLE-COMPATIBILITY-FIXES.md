# Correções de Compatibilidade Gradle - TruckGuard

## Problema Identificado

**Erro Original:**
```
Plugin 'org.gradle.toolchains.foojay-resolver-convention' version '0.5.0' was not found.
```

## Causa Raiz

- **Gradle 9.3.1** removeu a classe `JvmVendorSpec.IBM_SEMERU`
- **foojay-resolver-convention 0.5.0** ainda referenciava essa classe removida
- **React Native 0.85.3** + **Expo SDK 56** + **Gradle 9.3.1** = Incompatibilidade

## Correções Aplicadas

### 1. Versão do Gradle
- **Antes:** Gradle 9.3.1 (incompatível)
- **Depois:** Gradle 8.11.1 (estável e compatível)
- **Arquivo:** `frontend/android/gradle/wrapper/gradle-wrapper.properties`

### 2. Android Gradle Plugin
- **Antes:** AGP 8.12.0 (muito nova)
- **Depois:** AGP 8.7.3 (estável e compatível)
- **Arquivo:** `frontend/android/build.gradle`

### 3. foojay-resolver-convention
- **Antes:** versão 0.5.0 (incompatível)
- **Depois:** versão 1.0.0 (compatível com Gradle 8.11+)
- **Arquivo:** `frontend/node_modules/@react-native/gradle-plugin/settings.gradle.kts`

### 4. Versões das Ferramentas Android
- **minSdkVersion:** 24
- **targetSdkVersion:** 35 (compatível com Expo SDK 56)
- **compileSdkVersion:** 35
- **buildToolsVersion:** 35.0.0
- **ndkVersion:** 27.1.12297006
- **Kotlin:** 2.1.0

### 5. Otimizações de Performance
- Aumentou heap do Gradle: `-Xmx4096m`
- Habilitou build cache: `org.gradle.caching=true`
- Habilitou configuration cache: `org.gradle.configuration-cache=true`
- Otimizações Kotlin incremental

## Matrix de Compatibilidade

| Componente | Versão | Status |
|------------|---------|---------|
| Expo SDK | 56.0.8 | ✅ Compatível |
| React Native | 0.85.3 | ✅ Compatível |
| Gradle | 8.11.1 | ✅ Compatível |
| Android Gradle Plugin | 8.7.3 | ✅ Compatível |
| Kotlin | 2.1.0 | ✅ Compatível |
| Target SDK | 35 | ✅ Compatível |
| Compile SDK | 35 | ✅ Compatível |

## Scripts de Manutenção

### Correção Automática
```bash
npm run fix-gradle
```

### Build Android com Correção
```bash
npm run android
```

### Build Android Limpo
```bash
npm run android:clean
```

## Arquivos Modificados

1. `frontend/android/gradle/wrapper/gradle-wrapper.properties`
2. `frontend/android/build.gradle`
3. `frontend/android/gradle.properties`
4. `frontend/android/settings.gradle`
5. `frontend/android/gradle/libs.versions.toml` (novo)
6. `frontend/scripts/fix-gradle-compatibility.js` (novo)
7. `frontend/package.json` (scripts atualizados)
8. `frontend/node_modules/@react-native/gradle-plugin/settings.gradle.kts`

## Notas Importantes

1. **Patch Automático:** O script `fix-gradle-compatibility.js` corrige automaticamente o foojay-resolver após `npm install`

2. **Reinstalação:** Se o erro retornar após reinstalar node_modules, execute:
   ```bash
   npm run fix-gradle
   ```

3. **Java Version:** Certifique-se de usar Java 17+ para compatibilidade com foojay-resolver 1.0.0

4. **Gradle Daemon:** Em caso de problemas, limpe o cache do Gradle:
   ```bash
   cd android && ./gradlew --stop && ./gradlew clean
   ```

## Referências

- [React Native Issue #55781](https://github.com/facebook/react-native/issues/55781)
- [React Native PR #56210](https://github.com/facebook/react-native/pull/56210)
- [Foojay Resolver Documentation](https://github.com/gradle/foojay-toolchains)
- [Android Gradle Plugin Compatibility](https://developer.android.com/studio/releases/gradle-plugin)