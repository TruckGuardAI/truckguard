import { Redirect } from 'expo-router';

export default function VehicleRedirect() {
  return (
    <Redirect href="/(tabs)/profile" />
  );
}
