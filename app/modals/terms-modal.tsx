import React from 'react';

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { ModalRoot, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal-layout';

const TermsModal = () => {
  const router = useRouter();

  return (
    <ModalRoot>
      <ModalHeader
        title="Términos de Servicio"
        subtitle="Lee nuestros términos antes de continuar"
        onClose={router.back}
      />
      <ModalBody>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollContent}>
          <Section title="1. Aceptación de Términos">
            Al acceder y utilizar fitConnect, aceptas estar vinculado por estos términos y
            condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes
            utilizar nuestro servicio.
          </Section>

          <Section title="2. Descripción del Servicio">
            fitConnect es una plataforma de gestión de gimnasios que permite a los propietarios y
            entrenadores administrar miembros, planes de entrenamiento, reservas y comunicación. Nos
            reservamos el derecho de modificar o descontinuar el servicio en cualquier momento.
          </Section>

          <Section title="3. Responsabilidades del Usuario">
            Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Aceptas ser
            responsable de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos
            inmediatamente de cualquier uso no autorizado.
          </Section>

          <Section title="4. Contenido del Usuario">
            Al cargar contenido a fitConnect, otorgas a fitConnect una licencia mundial, no
            exclusiva, libre de regalías para usar, reproducir, modificar y distribuir dicho
            contenido.
          </Section>

          <Section title="5. Limitaciones de Responsabilidad">
            fitConnect no será responsable por daños indirectos, incidentales, especiales o
            consecuentes que surjan del uso o la imposibilidad de usar el servicio, incluso si hemos
            sido informados de la posibilidad de tales daños.
          </Section>

          <Section title="6. Cambios en los Términos">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
            entrarán en vigor inmediatamente después de su publicación. Tu uso continuado del
            servicio constituye tu aceptación de los términos modificados.
          </Section>

          <Section title="7. Ley Aplicable">
            Estos términos se rigen por las leyes de la jurisdicción donde se encuentra fitConnect,
            sin considerar sus disposiciones sobre conflictos de leyes.
          </Section>

          <Section title="8. Contacto">
            Si tienes preguntas sobre estos términos, contáctanos en support@fitconnect.com.
          </Section>
        </ScrollView>
      </ModalBody>
      <ModalFooter>
        <Button title="Entendido" onPress={router.back} />
      </ModalFooter>
    </ModalRoot>
  );
};

interface SectionProps {
  title: string;
  children: string;
}

const Section = ({ title, children }: SectionProps) => {

  return (
      <View style={S.section}>
        <Text style={[S.sectionTitle, { color: '#11181C' }]}>{title}</Text>
        <Text style={[S.sectionText, { color: '#687076' }]}>{children}</Text>
      </View>
  );
};

export default TermsModal

const S = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
