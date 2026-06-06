import { useEffect, useState } from 'react';

type LocationType = {
  latitude: number;
  longitude: number;
};

export default function useLocation() {
  const [location, setLocation] =
    useState<LocationType | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function getLocation() {
      try {
        if (
          typeof window ===
          'undefined'
        ) {
          setError(
            'Window indisponível'
          );

          setLoading(false);

          return;
        }

        if (
          !(
            'geolocation' in
            navigator
          )
        ) {
          setError(
            'Geolocalização não suportada'
          );

          setLoading(false);

          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            console.log(
              'LOCALIZAÇÃO:',
              latitude,
              longitude
            );

            if (
              typeof latitude !==
                'number' ||
              typeof longitude !==
                'number'
            ) {
              setError(
                'Coordenadas inválidas'
              );

              setLoading(false);

              return;
            }

            setLocation({
              latitude,
              longitude,
            });

            setError('');

            setLoading(false);
          },

          (geoError) => {
            console.error(
              'ERRO GEO:',
              geoError
            );

            setError(
              geoError.message ||
                'Erro localização'
            );

            setLoading(false);
          },

          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      } catch (err: any) {
        console.error(err);

        setError(
          err?.message ||
            'Erro inesperado'
        );

        setLoading(false);
      }
    }

    getLocation();
  }, []);

  return {
    location,
    loading,
    error,
  };
}